package com.rahi.apigateway.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.rahi.apigateway.dto.DashboardResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Service to aggregate data from multiple microservices
 * Demonstrates BFF (Backend for Frontend) pattern
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardAggregationService {

    private final WebClient.Builder webClientBuilder;

    @Value("${services.user-service.url}")
    private String userServiceUrl;

    @Value("${services.hazard-service.url}")
    private String hazardServiceUrl;

    @Value("${services.ai-service.url}")
    private String aiServiceUrl;

    public Mono<DashboardResponse> aggregateDashboardData(Long userId, Double lat, Double lon, Double radius, String authorizationHeader) {
        log.info("🔄 Aggregating dashboard data for user {} at ({}, {})", userId, lat, lon);

        // Parallel calls to all three services
        Mono<JsonNode> userMono = fetchUserData(userId, authorizationHeader);
        Mono<JsonNode> hazardMono = fetchHazardData(lat, lon, radius);
        Mono<JsonNode> suggestionMono = fetchAISuggestions(lat, lon);

        // Combine all responses
        return Mono.zip(userMono, hazardMono, suggestionMono)
                .map(tuple -> {
                    JsonNode user = tuple.getT1();
                    JsonNode hazards = tuple.getT2();
                    JsonNode suggestions = tuple.getT3();

                    return DashboardResponse.builder()
                            .userId(userId)
                            .location(Map.of("lat", lat, "lon", lon))
                            .userName(user != null ? user.get("name").asText() : "User")
                            .preferences(user != null && user.has("preferences") ? 
                                    user.get("preferences") : null)
                            .hazards(hazards)
                            .aiSuggestions(suggestions != null ? suggestions.get("reply").asText() : null)
                            .timestamp(java.time.Instant.now().toString())
                            .build();
                })
                .doOnSuccess(response -> log.info("✅ Dashboard aggregation completed for user {}", userId))
                .doOnError(error -> log.error("❌ Dashboard aggregation failed: {}", error.getMessage()))
                .onErrorResume(error -> {
                    // Return partial data on error
                    log.warn("⚠️ Returning partial dashboard data due to error: {}", error.getMessage());
                    return Mono.just(DashboardResponse.builder()
                            .userId(userId)
                            .location(Map.of("lat", lat, "lon", lon))
                            .userName("User")
                            .error("Some services unavailable")
                            .timestamp(java.time.Instant.now().toString())
                            .build());
                });
    }

    private Mono<JsonNode> fetchUserData(Long userId, String authorizationHeader) {
        WebClient client = webClientBuilder.baseUrl(userServiceUrl).build();
        
        return client.get()
                .uri("/api/users/me")
                .headers(headers -> {
                    if (authorizationHeader != null && !authorizationHeader.isEmpty()) {
                        headers.set("Authorization", authorizationHeader);
                    }
                })
                .retrieve()
                .bodyToMono(JsonNode.class)
                .timeout(Duration.ofSeconds(5))
                .doOnError(error -> log.error("Failed to fetch user data: {}", error.getMessage()))
                .onErrorResume(error -> Mono.empty());
    }

    private Mono<JsonNode> fetchHazardData(Double lat, Double lon, Double radius) {
        WebClient client = webClientBuilder.baseUrl(hazardServiceUrl).build();
        
        return client.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/hazards")
                        .queryParam("lat", lat)
                        .queryParam("lon", lon)
                        .queryParam("radius", radius)
                        .build())
                .retrieve()
                .bodyToMono(JsonNode.class)
                .timeout(Duration.ofSeconds(5))
                .doOnError(error -> log.error("Failed to fetch hazard data: {}", error.getMessage()))
                .onErrorResume(error -> Mono.empty());
    }

    private Mono<JsonNode> fetchAISuggestions(Double lat, Double lon) {
        WebClient client = webClientBuilder.baseUrl(aiServiceUrl).build();
        
        Map<String, Object> request = new HashMap<>();
        request.put("message", "What safety precautions should I take at my current location?");
        request.put("context", Map.of(
                "location", Map.of("lat", lat, "lon", lon),
                "preferences", Map.of("concise", true)
        ));
        
        return client.post()
                .uri("/api/chat")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .timeout(Duration.ofSeconds(10))
                .doOnError(error -> log.error("Failed to fetch AI suggestions: {}", error.getMessage()))
                .onErrorResume(error -> Mono.empty());
    }
}