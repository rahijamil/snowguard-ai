package com.rahi.apigateway.config;

import com.rahi.apigateway.filter.AuthenticationFilter;
import com.rahi.apigateway.filter.LoggingFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class GatewayConfig {

        private final AuthenticationFilter authFilter;
        private final LoggingFilter loggingFilter;

        @Bean
        public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
                return builder.routes()
                                // ======================================
                                // AUTHENTICATION - Handled by Gateway Controller
                                // NO ROUTING NEEDED (direct controller)
                                // ======================================

                                // ======================================
                                // USER SERVICE - via Eureka Service Discovery
                                // ======================================
                                .route("user-service", r -> r
                                                .path("/api/users/**")
                                                .filters(f -> f
                                                                .filter(loggingFilter)
                                                                .filter(authFilter.apply(
                                                                                new AuthenticationFilter.Config())))
                                                .uri("http://user-service:8081")) // Load balanced via Eureka

                                // ======================================
                                // HAZARD SERVICE - via Eureka Service Discovery
                                // ======================================
                                .route("hazard-service-hazards", r -> r
                                                .path("/api/hazards/**")
                                                .filters(f -> f
                                                                .filter(loggingFilter)
                                                                .filter(authFilter.apply(
                                                                                new AuthenticationFilter.Config())))
                                                .uri("http://hazard-service:8082"))

                                .route("hazard-service-routes", r -> r
                                                .path("/api/route/**")
                                                .filters(f -> f
                                                                .filter(loggingFilter)
                                                                .filter(authFilter.apply(
                                                                                new AuthenticationFilter.Config())))
                                                .uri("http://hazard-service:8082"))

                                // ======================================
                                // AI SERVICE - Direct URL (Python FastAPI, not in Eureka)
                                // ======================================
                                .route("ai-service-chat", r -> r
                                                .path("/api/chat/**")
                                                .filters(f -> f
                                                                .filter(loggingFilter)
                                                                .filter(authFilter.apply(
                                                                                new AuthenticationFilter.Config())))
                                                .uri("http://ai-service:8003"))

                                .route("ai-service-analysis", r -> r
                                                .path("/api/safety-analysis/**")
                                                .filters(f -> f
                                                                .filter(loggingFilter)
                                                                .filter(authFilter.apply(
                                                                                new AuthenticationFilter.Config())))
                                                .uri("http://ai-service:8003"))

                                // ======================================
                                // NOTIFICATION SERVICE - Direct URL (Node.js Express, not in Eureka)
                                // ======================================
                                .route("notification-service", r -> r
                                                .path("/api/notifications/**")
                                                .filters(f -> f
                                                                .filter(loggingFilter)
                                                                .filter(authFilter.apply(
                                                                                new AuthenticationFilter.Config())))
                                                .uri("http://notification-service:8004"))

                                // ======================================
                                // DASHBOARD AGGREGATION (Gateway Controller)
                                // ======================================
                                .route("dashboard", r -> r
                                                .path("/api/dashboard/**")
                                                .filters(f -> f
                                                                .filter(loggingFilter)
                                                                .filter(authFilter.apply(
                                                                                new AuthenticationFilter.Config())))
                                                .uri("forward:/"))

                                // ======================================
                                // HEALTH CHECKS (No Auth Required)
                                // ======================================
                                .route("health-gateway", r -> r
                                                .path("/actuator/**", "/api/gateway/**")
                                                .filters(f -> f.filter(loggingFilter))
                                                .uri("forward:/"))

                                .route("health-user", r -> r
                                                .path("/api/health/user")
                                                .filters(f -> f.filter(loggingFilter))
                                                .uri("forward:/"))

                                .route("health-hazard", r -> r
                                                .path("/api/health/hazard")
                                                .filters(f -> f.filter(loggingFilter))
                                                .uri("forward:/"))

                                .route("health-ai", r -> r
                                                .path("/api/health/ai")
                                                .filters(f -> f.filter(loggingFilter))
                                                .uri("forward:/"))

                                .route("health-notification", r -> r
                                                .path("/api/health/notification")
                                                .filters(f -> f.filter(loggingFilter))
                                                .uri("forward:/"))

                                .build();
        }
}