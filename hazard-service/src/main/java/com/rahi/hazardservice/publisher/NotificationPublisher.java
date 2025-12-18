package com.rahi.hazardservice.publisher;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationPublisher {

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    public void publishHazardAlert(Long userId, String hazardType, int severity, Map<String, Double> location) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("userId", userId);
            event.put("hazardType", hazardType);
            event.put("severity", severity);
            event.put("location", location);
            event.put("timestamp", System.currentTimeMillis());

            String message = objectMapper.writeValueAsString(event);
            redisTemplate.convertAndSend("hazard:alerts", message);
            
            log.info("Published hazard alert for user {}: {} (severity: {})", userId, hazardType, severity);
        } catch (Exception e) {
            log.error("Failed to publish hazard alert", e);
        }
    }

    public void publishRouteUpdate(Long userId, Long routeId, int riskScore) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("userId", userId);
            event.put("routeId", routeId);
            event.put("riskScore", riskScore);
            event.put("timestamp", System.currentTimeMillis());

            String message = objectMapper.writeValueAsString(event);
            redisTemplate.convertAndSend("route:updates", message);
            
            log.info("Published route update for user {}: route {} (risk: {})", userId, routeId, riskScore);
        } catch (Exception e) {
            log.error("Failed to publish route update", e);
        }
    }
}