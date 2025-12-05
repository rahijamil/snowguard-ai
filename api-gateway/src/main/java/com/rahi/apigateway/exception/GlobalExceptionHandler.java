package com.rahi.apigateway.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.error.ErrorAttributeOptions;
import org.springframework.boot.web.reactive.error.DefaultErrorAttributes;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Slf4j
@Component
public class GlobalExceptionHandler extends DefaultErrorAttributes {

    @Override
    public Map<String, Object> getErrorAttributes(ServerRequest request, ErrorAttributeOptions options) {
        Map<String, Object> errorAttributes = super.getErrorAttributes(request, options);
        
        Throwable error = getError(request);
        
        // Custom error handling
        if (error instanceof ResponseStatusException) {
            ResponseStatusException ex = (ResponseStatusException) error;
            errorAttributes.put("message", ex.getReason());
            // FIX: Get status code as integer, not cast to HttpStatus
            errorAttributes.put("status", ex.getStatusCode().value());
        }
        
        // Add timestamp
        errorAttributes.put("timestamp", java.time.Instant.now().toString());
        
        // Add request path
        errorAttributes.put("path", request.path());
        
        // Log error - FIX: Safely get status
        Object statusObj = errorAttributes.get("status");
        int statusCode = statusObj instanceof Integer ? (Integer) statusObj : 500;
        
        log.error("❌ Error {} on {}: {}", 
                statusCode, 
                request.path(), 
                errorAttributes.get("message"));
        
        return errorAttributes;
    }
}
