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

        @Value("${services.user-service.url:http://user-service:8081}")
        private String userServiceUrl;

        @Value("${services.hazard-service.url:http://hazard-service:8082}")
        private String hazardServiceUrl;

        @Value("${services.ai-service.url:http://ai-service:8003}")
        private String aiServiceUrl;

        @Value("${services.notification-service.url:http://notification-service:8004}")
        private String notificationServiceUrl;

        @GetMapping("/status")
        public Mono<ResponseEntity<Map<String, Object>>> getGatewayStatus() {
                log.info("🏥 Gateway status check requested");

                // Check all downstream services
                Mono<String> userStatus = checkServiceHealth(userServiceUrl, "/actuator/health");
                Mono<String> hazardStatus = checkServiceHealth(hazardServiceUrl, "/actuator/health");
                Mono<String> aiStatus = checkServiceHealth(aiServiceUrl, "/health");
                Mono<String> notificationStatus = checkServiceHealth(notificationServiceUrl, "/health");

                return Mono.zip(userStatus, hazardStatus, aiStatus, notificationStatus)
                                .map(tuple -> {
                                        Map<String, Object> status = new HashMap<>();
                                        status.put("gateway", "UP");
                                        status.put("timestamp", java.time.Instant.now());

                                        Map<String, String> services = new HashMap<>();
                                        services.put("user-service", tuple.getT1());
                                        services.put("hazard-service", tuple.getT2());
                                        services.put("ai-service", tuple.getT3());
                                        services.put("notification-service", tuple.getT4());
                                        status.put("services", services);

                                        // Overall health
                                        boolean allUp = tuple.getT1().equals("UP") &&
                                                        tuple.getT2().equals("UP") &&
                                                        tuple.getT3().equals("UP") &&
                                                        tuple.getT4().equals("UP");
                                        status.put("overall", allUp ? "HEALTHY" : "DEGRADED");

                                        return ResponseEntity.ok(status);
                                })
                                .defaultIfEmpty(ResponseEntity.status(503).body(Map.of(
                                                "gateway", "UP",
                                                "overall", "ERROR",
                                                "message", "Failed to check service health")));
        }

        @GetMapping("/routes")
        public ResponseEntity<Map<String, Object>> getRoutes() {
                Map<String, Object> routes = new HashMap<>();

                routes.put("authentication", Map.of(
                                "POST /api/auth/register", "User registration",
                                "POST /api/auth/login", "User login",
                                "POST /api/auth/refresh", "Refresh JWT token"));

                routes.put("user", Map.of(
                                "GET /api/users/me", "Get current user profile",
                                "GET /api/users/{id}", "Get user by ID",
                                "PUT /api/users/{id}/preferences", "Update user preferences"));

                routes.put("hazards", Map.of(
                                "GET /api/hazards", "Get hazards for location",
                                "GET /api/hazards/history", "Get historical hazard data"));

                routes.put("routing", Map.of(
                                "GET /api/route", "Calculate safe route"));

                routes.put("ai", Map.of(
                                "POST /api/chat", "AI chat for safety guidance",
                                "POST /api/safety-analysis", "Comprehensive safety analysis",
                                "GET /api/chat/history/{userId}", "Get chat history"));

                routes.put("notifications", Map.of(
                                "GET /api/notifications", "Get user notifications",
                                "POST /api/notifications", "Create notification",
                                "PUT /api/notifications/{id}/read", "Mark notification as read",
                                "DELETE /api/notifications/{id}", "Delete notification",
                                "GET /api/notifications/unread-count", "Get unread count"));

                routes.put("aggregation", Map.of(
                                "GET /api/dashboard", "Aggregated dashboard data",
                                "GET /api/dashboard/quick", "Quick dashboard (reduced data)"));

                routes.put("health", Map.of(
                                "GET /api/gateway/status", "Gateway and all services status",
                                "GET /api/health/user", "User service health",
                                "GET /api/health/hazard", "Hazard service health",
                                "GET /api/health/ai", "AI service health",
                                "GET /api/health/notification", "Notification service health"));

                routes.put("discovery", Map.of(
                                "GET /api/gateway/eureka", "View Eureka registered services",
                                "GET /api/gateway/config", "View configuration sources"));

                return ResponseEntity.ok(routes);
        }

        @GetMapping("/eureka")
        public ResponseEntity<Map<String, Object>> getEurekaInfo() {
                Map<String, Object> info = new HashMap<>();
                info.put("eureka-dashboard", "http://localhost:8761");
                info.put("description", "View all registered services in Eureka Dashboard");
                info.put("registered-services", Map.of(
                                "user-service", "lb://user-service",
                                "hazard-service", "lb://hazard-service",
                                "api-gateway", "lb://api-gateway",
                                "config-service", "lb://config-service"));
                info.put("non-eureka-services", Map.of(
                                "ai-service", "http://ai-service:8003 (Python FastAPI)",
                                "notification-service", "http://notification-service:8004 (Node.js Express)"));
                return ResponseEntity.ok(info);
        }

        @GetMapping("/config")
        public ResponseEntity<Map<String, Object>> getConfigInfo() {
                Map<String, Object> info = new HashMap<>();
                info.put("config-server", "http://localhost:8888");
                info.put("description", "Centralized configuration management");
                info.put("endpoints", Map.of(
                                "user-service-config", "http://localhost:8888/user-service/default",
                                "hazard-service-config", "http://localhost:8888/hazard-service/default",
                                "api-gateway-config", "http://localhost:8888/api-gateway/default"));
                return ResponseEntity.ok(info);
        }

        @GetMapping("/health/user")
        public Mono<ResponseEntity<String>> checkUserService() {
                return checkServiceHealth(userServiceUrl, "/actuator/health")
                                .map(status -> ResponseEntity.ok(status));
        }

        @GetMapping("/health/hazard")
        public Mono<ResponseEntity<String>> checkHazardService() {
                return checkServiceHealth(hazardServiceUrl, "/actuator/health")
                                .map(status -> ResponseEntity.ok(status));
        }

        @GetMapping("/health/ai")
        public Mono<ResponseEntity<String>> checkAiService() {
                return checkServiceHealth(aiServiceUrl, "/health")
                                .map(status -> ResponseEntity.ok(status));
        }

        @GetMapping("/health/notification")
        public Mono<ResponseEntity<String>> checkNotificationService() {
                return checkServiceHealth(notificationServiceUrl, "/health")
                                .map(status -> ResponseEntity.ok(status));
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
                                        log.error("Service health check failed for {}: {}", baseUrl,
                                                        error.getMessage());
                                        return Mono.just("DOWN");
                                });
        }
}