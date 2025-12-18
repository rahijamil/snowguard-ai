package com.rahi.hazardservice.controller;

import com.rahi.hazardservice.dto.HazardResponse;
import com.rahi.hazardservice.entity.Hazard;
import com.rahi.hazardservice.service.HazardAnalysisService;
import com.rahi.hazardservice.service.ValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/hazards")
@RequiredArgsConstructor
public class HazardController {

    private final HazardAnalysisService hazardAnalysisService;
    private final ValidationService validationService;

    @GetMapping
    public ResponseEntity<HazardResponse> getHazards(
            @RequestParam(name = "lat", required = true) Double lat,
            @RequestParam(name = "lon", required = true) Double lon,
            @RequestParam(name = "radius", defaultValue = "5.0") Double radius,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader) {

        log.info("GET /api/hazards - lat={}, lon={}, radius={}km, userId={}",
                lat, lon, radius, userIdHeader);

        // Validate inputs
        validationService.validateCoordinates(lat, lon, "Location");
        validationService.validateRadius(radius);

        Long userId = null;
        if (userIdHeader != null && !userIdHeader.isEmpty()) {
            try {
                userId = Long.parseLong(userIdHeader);
            } catch (NumberFormatException e) {
                log.warn("Invalid X-User-Id header: {}", userIdHeader);
            }
        }

        HazardResponse response = hazardAnalysisService.analyzeLocation(lat, lon, radius, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<List<Hazard>> getHistoricalHazards(
            @RequestParam(name = "lat", required = true) Double lat,
            @RequestParam(name = "lon", required = true) Double lon,
            @RequestParam(name = "radius", defaultValue = "5.0") Double radius,
            @RequestParam(name = "days", defaultValue = "7") Integer days) {

        log.info("GET /api/hazards/history - lat={}, lon={}, radius={}km, days={}",
                lat, lon, radius, days);

        // Validate inputs
        validationService.validateCoordinates(lat, lon, "Location");
        validationService.validateRadius(radius);
        validationService.validateDays(days);

        List<Hazard> history = hazardAnalysisService.getHistoricalHazards(lat, lon, radius, days);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "Hazard Service",
                "timestamp", java.time.Instant.now()));
    }

    @GetMapping("/api-docs")
    public ResponseEntity<Map<String, Object>> apiDocs() {
        return ResponseEntity.ok(Map.of(
                "endpoints", Map.of(
                        "GET /api/hazards", Map.of(
                                "description", "Get current hazards for a location",
                                "parameters", Map.of(
                                        "lat", "Latitude (-90 to 90) - REQUIRED",
                                        "lon", "Longitude (-180 to 180) - REQUIRED",
                                        "radius", "Search radius in km (0.1 to 100) - Optional, default: 5.0"),
                                "example", "/api/hazards?lat=43.65&lon=-79.38&radius=5"),
                        "GET /api/hazards/history", Map.of(
                                "description", "Get historical hazard data",
                                "parameters", Map.of(
                                        "lat", "Latitude (-90 to 90) - REQUIRED",
                                        "lon", "Longitude (-180 to 180) - REQUIRED",
                                        "radius", "Search radius in km - Optional, default: 5.0",
                                        "days", "Number of days (1 to 90) - Optional, default: 7"),
                                "example", "/api/hazards/history?lat=43.65&lon=-79.38&days=7"))));
    }
}