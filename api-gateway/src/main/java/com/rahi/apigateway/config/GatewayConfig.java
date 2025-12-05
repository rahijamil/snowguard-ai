package com.rahi.apigateway.config;

import com.rahi.apigateway.filter.AuthenticationFilter;
import com.rahi.apigateway.filter.LoggingFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class GatewayConfig {

    private final AuthenticationFilter authFilter;
    private final LoggingFilter loggingFilter;

    // Inject service URLs from properties
    @Value("${services.user-service.url}")
    private String userServiceUrl;

    @Value("${services.hazard-service.url}")
    private String hazardServiceUrl;

    @Value("${services.ai-service.url}")
    private String aiServiceUrl;

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                // ======================================
                // USER SERVICE
                // ======================================
                .route("user-service", r -> r
                        .path("/api/users/**")
                        .filters(f -> f
                                .filter(loggingFilter)
                                .filter(authFilter.apply(new AuthenticationFilter.Config())))
                        .uri(userServiceUrl))  // Use injected variable

                // ======================================
                // HAZARD SERVICE
                // ======================================
                .route("hazard-service", r -> r
                        .path("/api/hazards/**", "/api/route/**")
                        .filters(f -> f
                                .filter(loggingFilter)
                                .filter(authFilter.apply(new AuthenticationFilter.Config())))
                        .uri(hazardServiceUrl))  // Use injected variable

                // ======================================
                // AI SERVICE
                // ======================================
                .route("ai-service", r -> r
                        .path("/api/chat/**", "/api/safety-analysis/**", "/api/chat/history/**")
                        .filters(f -> f
                                .filter(loggingFilter)
                                .filter(authFilter.apply(new AuthenticationFilter.Config())))
                        .uri(aiServiceUrl))  // Use injected variable

                // ======================================
                // ROUTE HISTORY (in hazard service)
                // ======================================
                .route("route-history", r -> r
                        .path("/api/route/history")
                        .filters(f -> f
                                .filter(loggingFilter)
                                .filter(authFilter.apply(new AuthenticationFilter.Config())))
                        .uri(hazardServiceUrl))  // Use injected variable

                // ======================================
                // HEALTH CHECKS (No Auth)
                // ======================================
                .route("health", r -> r
                        .path("/actuator/**", "/api/gateway/**")
                        .filters(f -> f.filter(loggingFilter))
                        .uri("forward:/"))

                .build();
    }
}