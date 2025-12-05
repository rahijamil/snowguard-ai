package com.rahi.apigateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfig = new CorsConfiguration();
        
        // Allow frontend origins
        corsConfig.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://localhost:8000",
                "http://frontend:3000"
        ));
        
        // Allow all HTTP methods
        corsConfig.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        
        // Allow all headers
        corsConfig.setAllowedHeaders(List.of("*"));
        
        // ✅ CRITICAL: Allow credentials (cookies)
        corsConfig.setAllowCredentials(true);
        
        // Max age for preflight requests
        corsConfig.setMaxAge(3600L);
        
        // Expose headers to frontend
        corsConfig.setExposedHeaders(Arrays.asList(
                "X-Request-Id", 
                "X-User-Id", 
                "X-User-Email",
                "Set-Cookie" // ✅ Allow frontend to see Set-Cookie header
        ));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);

        return new CorsWebFilter(source);
    }
}