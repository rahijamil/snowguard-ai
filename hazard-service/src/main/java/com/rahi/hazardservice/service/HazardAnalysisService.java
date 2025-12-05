package com.rahi.hazardservice.service;

import com.rahi.hazardservice.dto.*;
import com.rahi.hazardservice.entity.Hazard;
import com.rahi.hazardservice.entity.HazardType;
import com.rahi.hazardservice.repository.HazardRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class HazardAnalysisService {

    private final HazardRepository hazardRepository;
    private final WeatherService weatherService;

    @Transactional
    public HazardResponse analyzeLocation(Double lat, Double lon, Double radiusKm) {
        log.info("Analyzing hazards for location: lat={}, lon={}, radius={}km", lat, lon, radiusKm);
        
        // Fetch current weather
        WeatherData weather = weatherService.fetchWeather(lat, lon);
        
        // Compute hazards from weather data
        List<Hazard> detectedHazards = detectHazards(lat, lon, weather);
        
        // Save to database
        hazardRepository.saveAll(detectedHazards);
        
        // Get recent hazards from DB within radius
        Instant since = Instant.now().minus(2, ChronoUnit.HOURS);
        List<Hazard> recentHazards = getHazardsInRadius(lat, lon, radiusKm, since);
        
        // Build summary
        List<HazardSummary> summary = buildHazardSummary(recentHazards);
        
        // Generate warning if needed
        String warning = generateWarning(summary);
        
        return HazardResponse.builder()
                .location(LocationDto.builder().lat(lat).lon(lon).build())
                .hazardSummary(summary)
                .timestamp(Instant.now())
                .warning(warning)
                .build();
    }

    private List<Hazard> detectHazards(Double lat, Double lon, WeatherData weather) {
        List<Hazard> hazards = new ArrayList<>();
        Instant now = Instant.now();
        
        // Snow detection
        if (weather.getWeatherCondition() != null && 
            weather.getWeatherCondition().toLowerCase().contains("snow")) {
            int severity = calculateSnowSeverity(weather);
            hazards.add(buildHazard(lat, lon, HazardType.SNOW, severity, weather, now));
        }
        
        // Ice detection (freezing conditions + precipitation)
        if (weather.getTemperature() != null && weather.getTemperature() <= 0 && 
            weather.getPrecipitation() != null && weather.getPrecipitation() > 0) {
            int severity = calculateIceSeverity(weather);
            hazards.add(buildHazard(lat, lon, HazardType.ICE, severity, weather, now));
        }
        
        // Low visibility
        if (weather.getVisibility() != null && weather.getVisibility() < 1000) {
            int severity = calculateVisibilitySeverity(weather);
            hazards.add(buildHazard(lat, lon, HazardType.LOW_VISIBILITY, severity, weather, now));
        }
        
        // High wind
        if (weather.getWindSpeed() != null && weather.getWindSpeed() > 10) {
            int severity = calculateWindSeverity(weather);
            hazards.add(buildHazard(lat, lon, HazardType.WIND, severity, weather, now));
        }
        
        // Extreme cold
        if (weather.getTemperature() != null && weather.getTemperature() < -10) {
            int severity = calculateColdSeverity(weather);
            hazards.add(buildHazard(lat, lon, HazardType.EXTREME_COLD, severity, weather, now));
        }
        
        // Fog
        if (weather.getWeatherCondition() != null && 
            weather.getWeatherCondition().toLowerCase().contains("fog")) {
            int severity = 60;
            hazards.add(buildHazard(lat, lon, HazardType.FOG, severity, weather, now));
        }
        
        return hazards;
    }

    private Hazard buildHazard(Double lat, Double lon, HazardType type, 
                                int severity, WeatherData weather, Instant timestamp) {
        return Hazard.builder()
                .latitude(lat)
                .longitude(lon)
                .hazardType(type)
                .severity(severity)
                .source("openweather")
                .timestamp(timestamp)
                .description(weather.getDescription())
                .temperature(weather.getTemperature())
                .windSpeed(weather.getWindSpeed())
                .precipitation(weather.getPrecipitation())
                .visibility(weather.getVisibility())
                .build();
    }

    private int calculateSnowSeverity(WeatherData weather) {
        int base = 50;
        if (weather.getPrecipitation() != null) {
            base += Math.min(30, weather.getPrecipitation().intValue() * 10);
        }
        if (weather.getWindSpeed() != null && weather.getWindSpeed() > 5) {
            base += 10; // Blowing snow
        }
        return Math.min(100, base);
    }

    private int calculateIceSeverity(WeatherData weather) {
        int base = 70; // Ice is inherently dangerous
        if (weather.getTemperature() != null && weather.getTemperature() < -5) {
            base += 15; // Very cold = black ice risk
        }
        return Math.min(100, base);
    }

    private int calculateVisibilitySeverity(WeatherData weather) {
        if (weather.getVisibility() == null) return 30;
        double vis = weather.getVisibility();
        if (vis < 100) return 95;
        if (vis < 500) return 75;
        return 50;
    }

    private int calculateWindSeverity(WeatherData weather) {
        double speed = weather.getWindSpeed();
        if (speed > 20) return 90;
        if (speed > 15) return 70;
        return 50;
    }

    private int calculateColdSeverity(WeatherData weather) {
        double temp = weather.getTemperature();
        if (temp < -20) return 95;
        if (temp < -15) return 80;
        return 60;
    }

    private List<Hazard> getHazardsInRadius(Double lat, Double lon, Double radiusKm, Instant since) {
        // Simple bounding box calculation (not perfect for large distances)
        double latDelta = radiusKm / 111.0; // ~111km per degree latitude
        double lonDelta = radiusKm / (111.0 * Math.cos(Math.toRadians(lat)));
        
        return hazardRepository.findWithinBounds(
                lat - latDelta, lat + latDelta,
                lon - lonDelta, lon + lonDelta,
                since
        );
    }

    private List<HazardSummary> buildHazardSummary(List<Hazard> hazards) {
        // Group by type and take max severity
        Map<HazardType, Integer> maxSeverityByType = hazards.stream()
                .collect(Collectors.groupingBy(
                        Hazard::getHazardType,
                        Collectors.collectingAndThen(
                                Collectors.maxBy(Comparator.comparingInt(Hazard::getSeverity)),
                                opt -> opt.map(Hazard::getSeverity).orElse(0)
                        )
                ));
        
        return maxSeverityByType.entrySet().stream()
                .map(e -> HazardSummary.builder()
                        .type(e.getKey())
                        .severity(e.getValue())
                        .description(generateDescription(e.getKey(), e.getValue()))
                        .build())
                .sorted(Comparator.comparingInt(HazardSummary::getSeverity).reversed())
                .collect(Collectors.toList());
    }

    private String generateDescription(HazardType type, int severity) {
        String level = severity > 80 ? "Severe" : severity > 60 ? "Moderate" : "Minor";
        return level + " " + type.name().toLowerCase().replace("_", " ") + " conditions";
    }

    private String generateWarning(List<HazardSummary> summaries) {
        if (summaries.isEmpty()) {
            return null;
        }
        
        int maxSeverity = summaries.get(0).getSeverity();
        if (maxSeverity > 80) {
            return "⚠️ SEVERE weather conditions detected. Avoid travel if possible.";
        } else if (maxSeverity > 60) {
            return "⚠️ Hazardous conditions present. Exercise extreme caution.";
        } else if (maxSeverity > 40) {
            return "⚠️ Minor hazards detected. Take appropriate precautions.";
        }
        return null;
    }

    public List<Hazard> getHistoricalHazards(Double lat, Double lon, Double radiusKm, int days) {
        Instant end = Instant.now();
        Instant start = end.minus(days, ChronoUnit.DAYS);
        
        double latDelta = radiusKm / 111.0;
        double lonDelta = radiusKm / (111.0 * Math.cos(Math.toRadians(lat)));
        
        return hazardRepository.findHistoricalHazards(
                lat - latDelta, lat + latDelta,
                lon - lonDelta, lon + lonDelta,
                start, end
        );
    }
}