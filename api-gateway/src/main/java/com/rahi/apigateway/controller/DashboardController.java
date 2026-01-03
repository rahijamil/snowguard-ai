package com.rahi.apigateway.controller;

import com.rahi.apigateway.dto.DashboardResponse;
import com.rahi.apigateway.service.DashboardAggregationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

/**
 * Dashboard aggregation endpoint
 * Combines data from multiple microservices for the frontend
 */
@Slf4j
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardAggregationService dashboardService;

    @GetMapping
    public Mono<ResponseEntity<DashboardResponse>> getDashboard(
            @RequestParam(required = true) Double lat,
            @RequestParam(required = true) Double lon,
            @RequestParam(defaultValue = "5.0") Double radius,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        
        if (userId == null) {
            log.warn("⚠️ Dashboard request missing X-User-Id header");
            // For now, return unauthorized or handle appropriately. 
            // In a real scenario, this should probably come from the security context or token.
             return Mono.just(ResponseEntity.status(401).build());
        }

        log.info("📊 Dashboard request for user {} at location ({}, {})", userId, lat, lon);
        
        return dashboardService.aggregateDashboardData(Long.parseLong(userId), lat, lon, radius, authorizationHeader)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.internalServerError().build());
    }

    @GetMapping("/quick")
    public Mono<ResponseEntity<DashboardResponse>> getQuickDashboard(
            @RequestParam(required = true) Double lat,
            @RequestParam(required = true) Double lon,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        
        if (userId == null) {
            log.warn("⚠️ Quick dashboard request missing X-User-Id header");
             return Mono.just(ResponseEntity.status(401).build());
        }

        log.info("⚡ Quick dashboard request for user {} at ({}, {})", userId, lat, lon);
        
        // Quick dashboard with reduced data
        return dashboardService.aggregateDashboardData(Long.parseLong(userId), lat, lon, 2.0, authorizationHeader)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.internalServerError().build());
    }
}