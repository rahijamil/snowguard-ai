

// ===== InternalAuthController.java - COMPLETE =====
package com.rahi.userservice.controller;

import com.rahi.userservice.dto.AuthRequest;
import com.rahi.userservice.dto.RegisterRequest;
import com.rahi.userservice.dto.UserAuthResponse;
import com.rahi.userservice.entity.User;
import com.rahi.userservice.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * INTERNAL AUTH CONTROLLER
 * Not exposed to public - only called by API Gateway
 * Handles credential validation and user creation
 * Does NOT generate JWT tokens
 */
@Slf4j
@RestController
@RequestMapping("/internal/auth")
@RequiredArgsConstructor
public class InternalAuthController {
    
    private final UserService userService;

    /**
     * Called by Gateway to create new user
     * Returns user data WITHOUT JWT token
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest req) {
        log.info("📝 Internal registration request for: {}", req.getEmail());
        
        try {
            User user = userService.register(req);
            
            UserAuthResponse response = UserAuthResponse.builder()
                    .userId(user.getId())
                    .email(user.getEmail())
                    .name(user.getName())
                    .build();
            
            log.info("✅ User registered: {} (ID: {})", user.getEmail(), user.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (IllegalArgumentException e) {
            log.warn("⚠️ Registration failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("❌ Registration error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Registration failed"));
        }
    }

    /**
     * Called by Gateway to validate credentials
     * Returns user data WITHOUT JWT token
     */
    @PostMapping("/validate")
    public ResponseEntity<?> validateCredentials(@Valid @RequestBody AuthRequest req) {
        log.info("🔐 Internal credential validation for: {}", req.getEmail());
        
        try {
            User user = userService.authenticate(req.getEmail(), req.getPassword());
            
            if (user == null) {
                log.warn("⚠️ Invalid credentials for: {}", req.getEmail());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid credentials"));
            }
            
            UserAuthResponse response = UserAuthResponse.builder()
                    .userId(user.getId())
                    .email(user.getEmail())
                    .name(user.getName())
                    .build();
            
            log.info("✅ Credentials validated for: {} (ID: {})", user.getEmail(), user.getId());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Validation error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Validation failed"));
        }
    }

    /**
     * Health check for internal endpoints
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "User Service - Internal Auth",
            "timestamp", java.time.Instant.now().toString()
        ));
    }
}