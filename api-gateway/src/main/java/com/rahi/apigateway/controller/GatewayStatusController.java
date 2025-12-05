package com.rahi.apigateway.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Gateway status and health check endpoints
 */
@Slf4j
@RestController
@RequestMapping("/api/gateway")
@RequiredArgsConstructor
public class GatewayStatusController {

    private final WebClient.Builder webClientBuilder;

    @Value("${services.user-service.url}")
    private String userServiceUrl;

    @Value("${services.hazard-service.url}")
    private String hazardServiceUrl;

    @Value("${services.ai-service.url}")
    private String aiServiceUrl;

    @GetMapping("/status")
    public Mono<ResponseEntity<Map<String, Object>>> getGatewayStatus() {
        log.info("🏥 Gateway status check requested");

        // Check all downstream services
        Mono<String> userStatus = checkServiceHealth(userServiceUrl, "/actuator/health");
        Mono<String> hazardStatus = checkServiceHealth(hazardServiceUrl, "/api/hazards/health");
        Mono<String> aiStatus = checkServiceHealth(aiServiceUrl, "/health");

        return Mono.zip(userStatus, hazardStatus, aiStatus)
                .map(tuple -> {
                    Map<String, Object> status = new HashMap<>();
                    status.put("gateway", "UP");
                    status.put("timestamp", java.time.Instant.now());
                    
                    Map<String, String> services = new HashMap<>();
                    services.put("user-service", tuple.getT1());
                    services.put("hazard-service", tuple.getT2());
                    services.put("ai-service", tuple.getT3());
                    status.put("services", services);
                    
                    // Overall health
                    boolean allUp = tuple.getT1().equals("UP") && 
                                   tuple.getT2().equals("UP") && 
                                   tuple.getT3().equals("UP");
                    status.put("overall", allUp ? "HEALTHY" : "DEGRADED");
                    
                    return ResponseEntity.ok(status);
                })
                .defaultIfEmpty(ResponseEntity.status(503).body(Map.of(
                        "gateway", "UP",
                        "overall", "ERROR",
                        "message", "Failed to check service health"
                )));
    }

    @GetMapping("/routes")
    public ResponseEntity<Map<String, Object>> getRoutes() {
        Map<String, Object> routes = new HashMap<>();
        
        routes.put("authentication", Map.of(
                "POST /api/auth/register", "User registration",
                "POST /api/auth/login", "User login"
        ));
        
        routes.put("user", Map.of(
                "GET /api/users/me", "Get current user profile",
                "PUT /api/users/{id}/preferences", "Update user preferences"
        ));
        
        routes.put("hazards", Map.of(
                "GET /api/hazards", "Get hazards for location",
                "GET /api/hazards/history", "Get historical hazard data"
        ));
        
        routes.put("routing", Map.of(
                "GET /api/route", "Calculate safe route"
        ));
        
        routes.put("ai", Map.of(
                "POST /api/chat", "AI chat for safety guidance",
                "POST /api/safety-analysis", "Comprehensive safety analysis",
                "GET /api/chat/history/{userId}", "Get chat history"
        ));
        
        routes.put("aggregation", Map.of(
                "GET /api/dashboard", "Aggregated dashboard data",
                "GET /api/dashboard/quick", "Quick dashboard (reduced data)"
        ));
        
        routes.put("health", Map.of(
                "GET /api/gateway/status", "Gateway and all services status",
                "GET /api/health/user", "User service health",
                "GET /api/health/hazard", "Hazard service health",
                "GET /api/health/ai", "AI service health"
        ));
        
        return ResponseEntity.ok(routes);
    }

    private Mono<String> checkServiceHealth(String baseUrl, String healthPath) {
        WebClient client = webClientBuilder.baseUrl(baseUrl).build();
        
        return client.get()
                .uri(healthPath)
                .retrieve()
                .toBodilessEntity()
                .timeout(Duration.ofSeconds(3))
                .map(response -> response.getStatusCode().is2xxSuccessful() ? "UP" : "DOWN")
                .onErrorResume(error -> {
                    log.error("Service health check failed for {}: {}", baseUrl, error.getMessage());
                    return Mono.just("DOWN");
                });
    }
}