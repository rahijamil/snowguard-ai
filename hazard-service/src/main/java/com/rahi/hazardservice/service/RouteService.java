package com.rahi.hazardservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rahi.hazardservice.dto.*;
import com.rahi.hazardservice.entity.Hazard;
import com.rahi.hazardservice.entity.Route;
import com.rahi.hazardservice.repository.HazardRepository;
import com.rahi.hazardservice.repository.RouteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class RouteService {

    private final RouteRepository routeRepository;
    private final HazardRepository hazardRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${routing.api.key:}")
    private String routingApiKey;

    @Value("${routing.api.provider:openrouteservice}")
    private String routingProvider;

    @Value("${routing.api.url:https://api.openrouteservice.org/v2/directions/foot-walking}")
    private String routingApiUrl;

    @Transactional
    public RouteResponse calculateSafeRoute(Double fromLat, Double fromLon, 
                                           Double toLat, Double toLon, String preference) {
        log.info("Calculating safe route from ({},{}) to ({},{})", fromLat, fromLon, toLat, toLon);
        
        // Check cache first
        Instant cacheThreshold = Instant.now().minus(10, ChronoUnit.MINUTES);
        Optional<Route> cached = routeRepository.findRecentRoute(
                fromLat, fromLon, toLat, toLon, cacheThreshold);
        
        if (cached.isPresent()) {
            log.info("Returning cached route");
            return buildRouteResponse(cached.get());
        }
        
        // Fetch base route from Mapbox
        List<LocationDto> basePath = fetchMapboxRoute(fromLon, fromLat, toLon, toLat);
        
        // Get hazards along the route
        List<Hazard> routeHazards = getHazardsAlongRoute(basePath);
        
        // Calculate risk score
        int riskScore = calculateRouteRiskScore(basePath, routeHazards);
        
        // Identify hotspots
        List<HazardHotspot> hotspots = identifyHotspots(basePath, routeHazards);
        
        // Calculate metrics
        double distance = calculateDistance(basePath);
        int duration = estimateDuration(distance, riskScore);
        
        // Build and save route
        Route route = saveRoute(fromLat, fromLon, toLat, toLon, basePath, 
                               riskScore, distance, duration, hotspots);
        
        return buildRouteResponse(route);
    }

    private List<LocationDto> fetchMapboxRoute(Double fromLon, Double fromLat, 
                                               Double toLon, Double toLat) {
        if (routingApiKey == null || routingApiKey.isEmpty()) {
            log.warn("Routing API key not configured, returning direct path");
            return createDirectPath(fromLon, fromLat, toLon, toLat);
        }
        
        try {
            if ("openrouteservice".equals(routingProvider)) {
                return fetchOpenRouteServiceRoute(fromLon, fromLat, toLon, toLat);
            } else if ("mapbox".equals(routingProvider)) {
                return fetchMapboxRouteAPI(fromLon, fromLat, toLon, toLat);
            } else {
                log.warn("Unknown routing provider: {}, using direct path", routingProvider);
                return createDirectPath(fromLon, fromLat, toLon, toLat);
            }
        } catch (Exception e) {
            log.error("Routing API call failed: {}", e.getMessage());
            return createDirectPath(fromLon, fromLat, toLon, toLat);
        }
    }

    private List<LocationDto> fetchOpenRouteServiceRoute(Double fromLon, Double fromLat, 
                                                         Double toLon, Double toLat) throws Exception {
        String url = String.format("%s?start=%s,%s&end=%s,%s",
                routingApiUrl, fromLon, fromLat, toLon, toLat);
        
        log.info("Fetching route from OpenRouteService");
        
        RestTemplate template = new RestTemplate();
        template.getInterceptors().add((request, body, execution) -> {
            request.getHeaders().add("Authorization", routingApiKey);
            return execution.execute(request, body);
        });
        
        String response = template.getForObject(url, String.class);
        return parseOpenRouteServiceResponse(response);
    }

    private List<LocationDto> parseOpenRouteServiceResponse(String json) throws Exception {
        JsonNode root = objectMapper.readTree(json);
        JsonNode features = root.get("features");
        
        if (features == null || features.size() == 0) {
            throw new RuntimeException("No routes found");
        }
        
        JsonNode geometry = features.get(0).get("geometry");
        JsonNode coordinates = geometry.get("coordinates");
        
        List<LocationDto> path = new ArrayList<>();
        for (JsonNode coord : coordinates) {
            path.add(LocationDto.builder()
                    .lon(coord.get(0).asDouble())
                    .lat(coord.get(1).asDouble())
                    .build());
        }
        
        return path;
    }

    private List<LocationDto> fetchMapboxRouteAPI(Double fromLon, Double fromLat, 
                                                  Double toLon, Double toLat) throws Exception {
        String url = String.format("https://api.mapbox.com/directions/v5/mapbox/walking/%s,%s;%s,%s?geometries=geojson&access_token=%s",
                fromLon, fromLat, toLon, toLat, routingApiKey);
        
        String response = restTemplate.getForObject(url, String.class);
        return parseMapboxResponse(response);
    }

    private List<LocationDto> parseMapboxResponse(String json) throws Exception {
        JsonNode root = objectMapper.readTree(json);
        JsonNode routes = root.get("routes");
        
        if (routes == null || routes.size() == 0) {
            throw new RuntimeException("No routes found");
        }
        
        JsonNode geometry = routes.get(0).get("geometry");
        JsonNode coordinates = geometry.get("coordinates");
        
        List<LocationDto> path = new ArrayList<>();
        for (JsonNode coord : coordinates) {
            path.add(LocationDto.builder()
                    .lon(coord.get(0).asDouble())
                    .lat(coord.get(1).asDouble())
                    .build());
        }
        
        return path;
    }

    private List<LocationDto> createDirectPath(Double fromLon, Double fromLat, 
                                               Double toLon, Double toLat) {
        // Simple direct path with 10 interpolated points
        List<LocationDto> path = new ArrayList<>();
        int segments = 10;
        
        for (int i = 0; i <= segments; i++) {
            double ratio = (double) i / segments;
            path.add(LocationDto.builder()
                    .lat(fromLat + (toLat - fromLat) * ratio)
                    .lon(fromLon + (toLon - fromLon) * ratio)
                    .build());
        }
        
        return path;
    }

    private List<Hazard> getHazardsAlongRoute(List<LocationDto> path) {
        // Get bounding box of route
        double minLat = path.stream().mapToDouble(LocationDto::getLat).min().orElse(0);
        double maxLat = path.stream().mapToDouble(LocationDto::getLat).max().orElse(0);
        double minLon = path.stream().mapToDouble(LocationDto::getLon).min().orElse(0);
        double maxLon = path.stream().mapToDouble(LocationDto::getLon).max().orElse(0);
        
        // Add buffer
        double buffer = 0.01; // ~1km
        minLat -= buffer;
        maxLat += buffer;
        minLon -= buffer;
        maxLon += buffer;
        
        Instant since = Instant.now().minus(2, ChronoUnit.HOURS);
        return hazardRepository.findWithinBounds(minLat, maxLat, minLon, maxLon, since);
    }

    private int calculateRouteRiskScore(List<LocationDto> path, List<Hazard> hazards) {
        if (hazards.isEmpty()) {
            return 0;
        }
        
        // Calculate weighted risk based on proximity to hazards
        double totalRisk = 0;
        int samples = 0;
        
        for (LocationDto point : path) {
            double nearestHazardSeverity = 0;
            double minDistance = Double.MAX_VALUE;
            
            for (Hazard h : hazards) {
                double dist = calculateDistanceKm(point.getLat(), point.getLon(), 
                                                  h.getLatitude(), h.getLongitude());
                if (dist < minDistance) {
                    minDistance = dist;
                    nearestHazardSeverity = h.getSeverity();
                }
            }
            
            // Weight decreases with distance (within 1km)
            if (minDistance < 1.0) {
                double weight = 1.0 - minDistance;
                totalRisk += nearestHazardSeverity * weight;
                samples++;
            }
        }
        
        return samples > 0 ? (int) (totalRisk / samples) : 0;
    }

    private List<HazardHotspot> identifyHotspots(List<LocationDto> path, List<Hazard> hazards) {
        List<HazardHotspot> hotspots = new ArrayList<>();
        
        // Find high-severity hazards near route
        for (Hazard h : hazards) {
            if (h.getSeverity() < 70) continue; // Only significant hazards
            
            // Check if hazard is near any point on route
            for (LocationDto point : path) {
                double dist = calculateDistanceKm(point.getLat(), point.getLon(),
                                                 h.getLatitude(), h.getLongitude());
                if (dist < 0.5) { // Within 500m
                    hotspots.add(HazardHotspot.builder()
                            .lat(h.getLatitude())
                            .lon(h.getLongitude())
                            .severity(h.getSeverity())
                            .hazardType(h.getHazardType().name())
                            .build());
                    break;
                }
            }
        }
        
        return hotspots;
    }

    private double calculateDistance(List<LocationDto> path) {
        double total = 0;
        for (int i = 0; i < path.size() - 1; i++) {
            total += calculateDistanceKm(
                    path.get(i).getLat(), path.get(i).getLon(),
                    path.get(i + 1).getLat(), path.get(i + 1).getLon()
            );
        }
        return total * 1000; // Convert to meters
    }

    private int estimateDuration(double distanceMeters, int riskScore) {
        // Base walking speed: 1.4 m/s (5 km/h)
        // Reduce speed based on risk: higher risk = slower
        double speedFactor = 1.0 - (riskScore / 200.0); // Max 50% reduction
        double effectiveSpeed = 1.4 * Math.max(0.5, speedFactor);
        return (int) (distanceMeters / effectiveSpeed);
    }

    private double calculateDistanceKm(Double lat1, Double lon1, Double lat2, Double lon2) {
        // Haversine formula
        double R = 6371; // Earth radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private Route saveRoute(Double fromLat, Double fromLon, Double toLat, Double toLon,
                           List<LocationDto> path, int riskScore, double distance, 
                           int duration, List<HazardHotspot> hotspots) {
        try {
            String pathJson = objectMapper.writeValueAsString(path);
            String hotspotsJson = objectMapper.writeValueAsString(hotspots);
            
            Route route = Route.builder()
                    .fromLatitude(fromLat)
                    .fromLongitude(fromLon)
                    .toLatitude(toLat)
                    .toLongitude(toLon)
                    .pathJson(pathJson)
                    .riskScore(riskScore)
                    .distanceMeters(distance)
                    .durationSeconds(duration)
                    .hazardHotspotsJson(hotspotsJson)
                    .build();
            
            return routeRepository.save(route);
        } catch (Exception e) {
            log.error("Failed to save route: {}", e.getMessage());
            throw new RuntimeException("Route save failed", e);
        }
    }

    private RouteResponse buildRouteResponse(Route route) {
        try {
            List<LocationDto> path = objectMapper.readValue(
                    route.getPathJson(), 
                    objectMapper.getTypeFactory().constructCollectionType(List.class, LocationDto.class));
            
            List<HazardHotspot> hotspots = objectMapper.readValue(
                    route.getHazardHotspotsJson(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, HazardHotspot.class));
            
            String recommendation = generateRecommendation(route.getRiskScore(), hotspots.size());
            
            return RouteResponse.builder()
                    .path(path)
                    .distanceMeters(route.getDistanceMeters())
                    .durationSeconds(route.getDurationSeconds())
                    .riskScore(route.getRiskScore())
                    .hazardHotspots(hotspots)
                    .recommendation(recommendation)
                    .build();
        } catch (Exception e) {
            log.error("Failed to build route response: {}", e.getMessage());
            throw new RuntimeException("Route response build failed", e);
        }
    }

    private String generateRecommendation(int riskScore, int hotspotCount) {
        if (riskScore > 80) {
            return "⚠️ High risk route. Consider delaying travel or finding alternative transportation.";
        } else if (riskScore > 60) {
            return "⚠️ Moderate risk. Wear appropriate footwear and allow extra travel time.";
        } else if (riskScore > 30) {
            return "✓ Route is passable with caution. Watch for icy patches.";
        } else {
            return "✓ Route appears safe under current conditions.";
        }
    }

    public List<Route> findRecentRoute(Instant since) {
        return routeRepository.findRecentRoute(since);
    }
}