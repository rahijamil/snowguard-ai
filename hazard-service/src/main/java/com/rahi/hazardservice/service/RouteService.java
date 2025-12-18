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
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
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
                                           Double toLat, Double toLon, 
                                           String preference, Long userId) {
        log.info("Calculating safe route from ({},{}) to ({},{}) for user {}", 
                fromLat, fromLon, toLat, toLon, userId);
        
        // Check cache first (user-specific if userId provided)
        Instant cacheThreshold = Instant.now().minus(10, ChronoUnit.MINUTES);
        Optional<Route> cached = Optional.empty();
        
        if (userId != null) {
            cached = routeRepository.findRecentRouteForUser(
                    userId, fromLat, fromLon, toLat, toLon, cacheThreshold);
        }
        
        if (cached.isPresent()) {
            log.info("Returning cached route for user {}", userId);
            return buildRouteResponse(cached.get());
        }
        
        // Fetch base route
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
        
        // Build and save route WITH userId
        Route route = saveRoute(userId, fromLat, fromLon, toLat, toLon, basePath, 
                               riskScore, distance, duration, hotspots);
        
        log.info("Route saved successfully with ID {} for user {}", route.getId(), userId);
        
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
        // OpenRouteService uses GeoJSON format with coordinates as [lon, lat]
        String coordinates = String.format("%s,%s;%s,%s", fromLon, fromLat, toLon, toLat);
        String url = String.format("%s?api_key=%s&coordinates=%s&profile=foot-walking&format=geojson",
                routingApiUrl, routingApiKey, coordinates);
        
        log.info("Fetching route from OpenRouteService: {}", url);
        
        HttpHeaders headers = new HttpHeaders();
        headers.set("Accept", "application/json, application/geo+json");
        headers.set("Content-Type", "application/json");
        
        HttpEntity<String> entity = new HttpEntity<>(headers);
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
        
        return parseOpenRouteServiceResponse(response.getBody());
    }

    private List<LocationDto> parseOpenRouteServiceResponse(String json) throws Exception {
        JsonNode root = objectMapper.readTree(json);
        JsonNode features = root.get("features");
        
        if (features == null || features.size() == 0) {
            throw new RuntimeException("No routes found in OpenRouteService response");
        }
        
        JsonNode geometry = features.get(0).get("geometry");
        JsonNode coordinates = geometry.get("coordinates");
        
        List<LocationDto> path = new ArrayList<>();
        for (JsonNode coord : coordinates) {
            // OpenRouteService returns coordinates as [longitude, latitude]
            path.add(LocationDto.builder()
                    .lon(coord.get(0).asDouble())
                    .lat(coord.get(1).asDouble())
                    .build());
        }
        
        log.info("Parsed {} points from OpenRouteService response", path.size());
        return path;
    }

    private List<LocationDto> fetchMapboxRouteAPI(Double fromLon, Double fromLat, 
                                                  Double toLon, Double toLat) throws Exception {
        String url = String.format("https://api.mapbox.com/directions/v5/mapbox/walking/%s,%s;%s,%s?geometries=geojson&access_token=%s",
                fromLon, fromLat, toLon, toLat, routingApiKey);
        
        log.info("Fetching route from Mapbox: {}", url);
        
        String response = restTemplate.getForObject(url, String.class);
        return parseMapboxResponse(response);
    }

    private List<LocationDto> parseMapboxResponse(String json) throws Exception {
        JsonNode root = objectMapper.readTree(json);
        JsonNode routes = root.get("routes");
        
        if (routes == null || routes.size() == 0) {
            throw new RuntimeException("No routes found in Mapbox response");
        }
        
        JsonNode geometry = routes.get(0).get("geometry");
        JsonNode coordinates = geometry.get("coordinates");
        
        List<LocationDto> path = new ArrayList<>();
        for (JsonNode coord : coordinates) {
            // Mapbox returns coordinates as [longitude, latitude]
            path.add(LocationDto.builder()
                    .lon(coord.get(0).asDouble())
                    .lat(coord.get(1).asDouble())
                    .build());
        }
        
        log.info("Parsed {} points from Mapbox response", path.size());
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
        
        log.info("Created direct path with {} points", path.size());
        return path;
    }

    private List<Hazard> getHazardsAlongRoute(List<LocationDto> path) {
        // Get bounding box of route
        double minLat = path.stream().mapToDouble(LocationDto::getLat).min().orElse(0);
        double maxLat = path.stream().mapToDouble(LocationDto::getLat).max().orElse(0);
        double minLon = path.stream().mapToDouble(LocationDto::getLon).min().orElse(0);
        double maxLon = path.stream().mapToDouble(LocationDto::getLon).max().orElse(0);
        
        // Add buffer (~1km)
        double buffer = 0.01;
        minLat -= buffer;
        maxLat += buffer;
        minLon -= buffer;
        maxLon += buffer;
        
        Instant since = Instant.now().minus(2, ChronoUnit.HOURS);
        List<Hazard> hazards = hazardRepository.findWithinBounds(minLat, maxLat, minLon, maxLon, since);
        
        log.info("Found {} hazards along route path", hazards.size());
        return hazards;
    }

    private int calculateRouteRiskScore(List<LocationDto> path, List<Hazard> hazards) {
        if (hazards.isEmpty()) {
            log.info("No hazards found, risk score: 0");
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
        
        int riskScore = samples > 0 ? (int) (totalRisk / samples) : 0;
        log.info("Calculated risk score: {} (based on {} samples)", riskScore, samples);
        return riskScore;
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
        
        log.info("Identified {} hazard hotspots", hotspots.size());
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
        double distanceMeters = total * 1000; // Convert to meters
        log.info("Calculated route distance: {} km ({} meters)", total, distanceMeters);
        return distanceMeters;
    }

    private int estimateDuration(double distanceMeters, int riskScore) {
        // Base walking speed: 1.4 m/s (5 km/h)
        // Reduce speed based on risk: higher risk = slower
        double speedFactor = 1.0 - (riskScore / 200.0); // Max 50% reduction
        double effectiveSpeed = 1.4 * Math.max(0.5, speedFactor);
        int durationSeconds = (int) (distanceMeters / effectiveSpeed);
        
        log.info("Estimated duration: {} seconds (distance: {}m, risk: {}, speed: {} m/s)", 
                durationSeconds, distanceMeters, riskScore, effectiveSpeed);
        return durationSeconds;
    }

    private double calculateDistanceKm(Double lat1, Double lon1, Double lat2, Double lon2) {
        // Haversine formula for distance between two points
        double R = 6371; // Earth radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private Route saveRoute(Long userId, Double fromLat, Double fromLon, Double toLat, Double toLon,
                           List<LocationDto> path, int riskScore, double distance, 
                           int duration, List<HazardHotspot> hotspots) {
        try {
            String pathJson = objectMapper.writeValueAsString(path);
            String hotspotsJson = objectMapper.writeValueAsString(hotspots);
            
            Route route = Route.builder()
                    .userId(userId)
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
            
            Route saved = routeRepository.save(route);
            log.info("✅ Route saved: ID={}, userId={}, from=({},{}), to=({},{}), risk={}", 
                    saved.getId(), saved.getUserId(), fromLat, fromLon, toLat, toLon, riskScore);
            
            return saved;
        } catch (Exception e) {
            log.error("Failed to save route: {}", e.getMessage(), e);
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

    // Find routes for specific user
    public List<Route> findRoutesForUser(Long userId, Instant since) {
        return routeRepository.findByUserIdAndCreatedAtAfter(userId, since);
    }

    // Find all recent routes
    public List<Route> findRecentRoutes(Instant since) {
        return routeRepository.findRecentRoutes(since);
    }

    // Delete old routes for specific user
    @Transactional
    public void deleteOldRoutesForUser(Long userId, Instant cutoff) {
        routeRepository.deleteByUserIdAndCreatedAtBefore(userId, cutoff);
    }
}