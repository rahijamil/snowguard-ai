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
            @RequestHeader("X-User-Id") String userId) {
        
        log.info("📊 Dashboard request for user {} at location ({}, {})", userId, lat, lon);
        
        return dashboardService.aggregateDashboardData(Long.parseLong(userId), lat, lon, radius)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.internalServerError().build());
    }

    @GetMapping("/quick")
    public Mono<ResponseEntity<DashboardResponse>> getQuickDashboard(
            @RequestParam(required = true) Double lat,
            @RequestParam(required = true) Double lon,
            @RequestHeader("X-User-Id") String userId) {
        
        log.info("⚡ Quick dashboard request for user {} at ({}, {})", userId, lat, lon);
        
        // Quick dashboard with reduced data
        return dashboardService.aggregateDashboardData(Long.parseLong(userId), lat, lon, 2.0)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.internalServerError().build());
    }
}