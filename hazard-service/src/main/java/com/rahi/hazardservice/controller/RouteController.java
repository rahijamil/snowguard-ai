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
import java.util.*;
import java.util.stream.Collectors;

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
            @RequestParam(name = "pref", defaultValue = "safe") String pref,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader) {  // ✅ Get user from header
        
        log.info("GET /api/route - from=({},{}), to=({},{}), pref={}, userId={}", 
                fromLat, fromLon, toLat, toLon, pref, userIdHeader);
        
        // Validate inputs
        validationService.validateRouteCoordinates(fromLat, fromLon, toLat, toLon);
        
        // Parse userId (can be null for anonymous users)
        Long userId = null;
        if (userIdHeader != null && !userIdHeader.isEmpty()) {
            try {
                userId = Long.parseLong(userIdHeader);
            } catch (NumberFormatException e) {
                log.warn("Invalid user ID format: {}", userIdHeader);
            }
        }
        
        // Calculate route with userId
        RouteResponse response = routeService.calculateSafeRoute(
                fromLat, fromLon, toLat, toLon, pref, userId);  // ✅ Pass userId
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<?> getRouteHistory(
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestParam(name = "days", defaultValue = "30") Integer days) {
        
        log.info("GET /api/route/history - userId={}, days={}", userIdHeader, days);
        
        try {
            // Parse userId
            Long userId = null;
            if (userIdHeader != null && !userIdHeader.isEmpty()) {
                try {
                    userId = Long.parseLong(userIdHeader);
                } catch (NumberFormatException e) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "Invalid user ID format"));
                }
            }
            
            // Calculate date threshold
            Instant since = Instant.now().minus(days, ChronoUnit.DAYS);
            
            // Get routes from repository
            List<Route> routes;
            if (userId != null) {
                routes = routeService.findRoutesForUser(userId, since);
                log.info("Found {} routes for user {}", routes.size(), userId);
            } else {
                routes = routeService.findRecentRoutes(since);
                log.info("Found {} recent routes (no user filter)", routes.size());
            }
            
            // Convert to simplified response
            List<Map<String, Object>> routeHistory = routes.stream()
                    .map(route -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", route.getId());
                        map.put("userId", route.getUserId());
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
            
            return ResponseEntity.ok(Map.of(
                "userId", userId != null ? userId : "anonymous",
                "days", days,
                "count", routeHistory.size(),
                "routes", routeHistory
            ));
            
        } catch (Exception e) {
            log.error("Failed to fetch route history: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to fetch route history: " + e.getMessage()));
        }
    }

    @DeleteMapping("/history")
    public ResponseEntity<?> clearHistory(
            @RequestHeader(value = "X-User-Id", required = true) String userIdHeader,
            @RequestParam(name = "days", defaultValue = "30") Integer days) {
        
        log.info("DELETE /api/route/history - userId={}, days={}", userIdHeader, days);
        
        try {
            Long userId = Long.parseLong(userIdHeader);
            Instant cutoff = Instant.now().minus(days, ChronoUnit.DAYS);
            
            routeService.deleteOldRoutesForUser(userId, cutoff);
            
            return ResponseEntity.ok(Map.of(
                "message", "Route history cleared successfully",
                "userId", userId,
                "olderThan", days + " days"
            ));
            
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid user ID format"));
        } catch (Exception e) {
            log.error("Failed to clear history: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to clear history"));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "Route Service",
            "timestamp", Instant.now().toString()
        ));
    }

    @GetMapping("/api-docs")
    public ResponseEntity<Map<String, Object>> apiDocs() {
        return ResponseEntity.ok(Map.of(
            "endpoints", Map.of(
                "GET /api/route", Map.of(
                    "description", "Calculate safe route between two points",
                    "parameters", Map.of(
                        "fromLat", "Start latitude (-90 to 90) - REQUIRED",
                        "fromLon", "Start longitude (-180 to 180) - REQUIRED",
                        "toLat", "End latitude (-90 to 90) - REQUIRED",
                        "toLon", "End longitude (-180 to 180) - REQUIRED",
                        "pref", "Route preference (safe/fast/short) - Optional, default: safe"
                    ),
                    "headers", Map.of(
                        "X-User-Id", "User ID for route history tracking - Optional"
                    ),
                    "example", "/api/route?fromLat=43.65&fromLon=-79.38&toLat=43.66&toLon=-79.37"
                ),
                "GET /api/route/history", Map.of(
                    "description", "Get route calculation history",
                    "parameters", Map.of(
                        "days", "Number of days to look back (default: 30)"
                    ),
                    "headers", Map.of(
                        "X-User-Id", "User ID to filter routes - Optional"
                    )
                ),
                "DELETE /api/route/history", Map.of(
                    "description", "Clear route history for user",
                    "parameters", Map.of(
                        "days", "Delete routes older than N days (default: 30)"
                    ),
                    "headers", Map.of(
                        "X-User-Id", "User ID - REQUIRED"
                    )
                )
            )
        ));
    }
}
