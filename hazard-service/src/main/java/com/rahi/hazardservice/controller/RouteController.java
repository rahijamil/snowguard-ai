
package com.rahi.hazardservice.controller;

import com.rahi.hazardservice.dto.RouteResponse;
import com.rahi.hazardservice.entity.Route;
import com.rahi.hazardservice.service.RouteService;
import com.rahi.hazardservice.service.ValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/route")
@RequiredArgsConstructor
public class RouteController {

    private final RouteService routeService;
    private final ValidationService validationService;

    @GetMapping
    public ResponseEntity<RouteResponse> calculateRoute(
            @RequestParam(name = "fromLat", required = true) Double fromLat,
            @RequestParam(name = "fromLon", required = true) Double fromLon,
            @RequestParam(name = "toLat", required = true) Double toLat,
            @RequestParam(name = "toLon", required = true) Double toLon,
            @RequestParam(name = "pref", defaultValue = "safe") String pref) {
        
        log.info("GET /api/route - from=({},{}), to=({},{}), pref={}", 
                fromLat, fromLon, toLat, toLon, pref);
        
        // Validate inputs
        validationService.validateRouteCoordinates(fromLat, fromLon, toLat, toLon);
        
        RouteResponse response = routeService.calculateSafeRoute(
                fromLat, fromLon, toLat, toLon, pref);
        
        return ResponseEntity.ok(response);
    }

 @GetMapping("/history")
public ResponseEntity<?> getRouteHistory(
        @RequestParam(name = "userId", required = false) Long userId,
        @RequestParam(name = "days", defaultValue = "30") Integer days) {
    
    log.info("GET /api/route/history - userId={}, days={}", userId, days);
    
    try {
        // Calculate date threshold
        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);
        
        // Get routes from repository
        List<Route> routes = routeService.findRecentRoute(since);
        
        // Convert to simplified response - Use HashMap to avoid type inference issues
        List<Map<String, Object>> routeHistory = routes.stream()
                .map(route -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", route.getId());
                    map.put("fromLatitude", route.getFromLatitude());
                    map.put("fromLongitude", route.getFromLongitude());
                    map.put("toLatitude", route.getToLatitude());
                    map.put("toLongitude", route.getToLongitude());
                    map.put("distanceMeters", route.getDistanceMeters());
                    map.put("durationSeconds", route.getDurationSeconds());
                    map.put("riskScore", route.getRiskScore());
                    map.put("createdAt", route.getCreatedAt().toString());
                    return map;
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(routeHistory);
        
    } catch (Exception e) {
        log.error("Failed to fetch route history: {}", e.getMessage());
        // For the error response, use simple types
        return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to fetch route history"));
    }
}

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "Route Service",
            "timestamp", java.time.Instant.now()
        ));
    }

    @GetMapping("/api-docs")
    public ResponseEntity<Map<String, Object>> apiDocs() {
        return ResponseEntity.ok(Map.of(
            "endpoint", "GET /api/route",
            "description", "Calculate safe route between two points",
            "parameters", Map.of(
                "fromLat", "Start latitude (-90 to 90) - REQUIRED",
                "fromLon", "Start longitude (-180 to 180) - REQUIRED",
                "toLat", "End latitude (-90 to 90) - REQUIRED",
                "toLon", "End longitude (-180 to 180) - REQUIRED",
                "pref", "Route preference (safe/fast/short) - Optional, default: safe"
            ),
            "example", "/api/route?fromLat=43.65&fromLon=-79.38&toLat=43.66&toLon=-79.37",
            "constraints", Map.of(
                "maxDistance", "50 km",
                "coordinates", "Start and end cannot be the same"
            )
        ));
    }
}