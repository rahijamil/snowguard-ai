package com.rahi.apigateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.core.Ordered;
import org.springframework.http.HttpMethod;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;

@Slf4j
@Component
public class LoggingFilter implements GatewayFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        Instant startTime = Instant.now();
        
        // Generate request ID
        String requestId = java.util.UUID.randomUUID().toString().substring(0, 8);
        
        // Log incoming request
        log.info("🔵 [{}] {} {} from {} | Headers: {}",
                requestId,
                request.getMethod(),
                request.getPath(),
                request.getRemoteAddress(),
                request.getHeaders().getFirst("User-Agent"));

        // Add request ID to headers
        ServerHttpRequest modifiedRequest = request.mutate()
                .header("X-Request-Id", requestId)
                .build();

        return chain.filter(exchange.mutate().request(modifiedRequest).build())
                .doOnSuccess(aVoid -> {
                    ServerHttpResponse response = exchange.getResponse();
                    Duration duration = Duration.between(startTime, Instant.now());
                    
                    // Log response
                    log.info("🟢 [{}] {} {} | Status: {} | Duration: {}ms",
                            requestId,
                            request.getMethod(),
                            request.getPath(),
                            response.getStatusCode(),
                            duration.toMillis());
                })
                .doOnError(error -> {
                    Duration duration = Duration.between(startTime, Instant.now());
                    log.error("🔴 [{}] {} {} | Error: {} | Duration: {}ms",
                            requestId,
                            request.getMethod(),
                            request.getPath(),
                            error.getMessage(),
                            duration.toMillis());
                });
    }

    @Override
    public int getOrder() {
        return -1; // Run first
    }
}