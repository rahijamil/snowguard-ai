package com.rahi.apigateway.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.rahi.apigateway.dto.AuthRequest;
import com.rahi.apigateway.dto.AuthResponse;
import com.rahi.apigateway.dto.RegisterRequest;
import com.rahi.apigateway.util.JwtUtil;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final WebClient.Builder webClientBuilder;
    private final JwtUtil jwtUtil;

    @Value("${services.user-service.url}")
    private String userServiceUrl;

    /**
     * PUBLIC: Register new user
     */
    @PostMapping("/register")
    public Mono<ResponseEntity<Object>> register(@RequestBody RegisterRequest request) {
        log.info("📝 Register request: {}", request.getEmail());
        
        WebClient client = webClientBuilder.baseUrl(userServiceUrl).build();
        
        return client.post()
                .uri("/internal/auth/register")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .timeout(Duration.ofSeconds(5))
                .map(response -> {
                    Long userId = response.get("userId").asLong();
                    String email = response.get("email").asText();
                    String name = response.has("name") ? response.get("name").asText() : email;

                    String token = jwtUtil.generateToken(userId, email);
                    ResponseCookie cookie = createAuthCookie(token);

                    log.info("✅ Registration successful: {} (ID: {})", email, userId);

                    AuthResponse authResponse = AuthResponse.builder()
                            .token(token)
                            .userId(userId)
                            .email(email)
                            .name(name)
                            .build();

                    return ResponseEntity.ok()
                            .header(HttpHeaders.SET_COOKIE, cookie.toString())
                            .body((Object) authResponse);
                })
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.error("❌ Registration failed: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
                    
                    Map<String, String> errorBody = new HashMap<>();
                    errorBody.put("error", ex.getStatusCode() == HttpStatus.BAD_REQUEST 
                            ? ex.getResponseBodyAsString() 
                            : "Registration failed");
                    
                    return Mono.just(ResponseEntity
                            .status(ex.getStatusCode())
                            .body((Object) errorBody));
                })
                .onErrorResume(ex -> {
                    log.error("❌ Registration error: {}", ex.getMessage());
                    Map<String, String> errorBody = new HashMap<>();
                    errorBody.put("error", "Service unavailable");
                    return Mono.just(ResponseEntity
                            .status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body((Object) errorBody));
                });
    }

    /**
     * PUBLIC: Login existing user
     */
    @PostMapping("/login")
    public Mono<ResponseEntity<Object>> login(@RequestBody AuthRequest request) {
        log.info("🔐 Login request: {}", request.getEmail());
        
        WebClient client = webClientBuilder.baseUrl(userServiceUrl).build();
        
        return client.post()
                .uri("/internal/auth/validate")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .timeout(Duration.ofSeconds(5))
                .map(response -> {
                    Long userId = response.get("userId").asLong();
                    String email = response.get("email").asText();
                    String name = response.has("name") ? response.get("name").asText() : email;

                    String token = jwtUtil.generateToken(userId, email);
                    ResponseCookie cookie = createAuthCookie(token);

                    log.info("✅ Login successful: {} (ID: {})", email, userId);

                    AuthResponse authResponse = AuthResponse.builder()
                            .token(token)
                            .userId(userId)
                            .email(email)
                            .name(name)
                            .build();

                    return ResponseEntity.ok()
                            .header(HttpHeaders.SET_COOKIE, cookie.toString())
                            .body((Object) authResponse);
                })
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.error("❌ Login failed: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
                    
                    Map<String, String> errorBody = new HashMap<>();
                    if (ex.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                        errorBody.put("error", "Invalid credentials");
                    } else {
                        errorBody.put("error", "Login failed");
                    }
                    
                    return Mono.just(ResponseEntity
                            .status(ex.getStatusCode())
                            .body((Object) errorBody));
                })
                .onErrorResume(ex -> {
                    log.error("❌ Login error: {}", ex.getMessage());
                    Map<String, String> errorBody = new HashMap<>();
                    errorBody.put("error", "Service unavailable");
                    return Mono.just(ResponseEntity
                            .status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body((Object) errorBody));
                });
    }

    /**
     * PUBLIC: Refresh JWT token
     */
    @PostMapping("/refresh")
    public ResponseEntity<Object> refresh(
            @CookieValue(value = "auth-token", required = false) String token,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        log.info("🔄 Refresh token request");

        // Get token from cookie or Authorization header
        String actualToken = token;
        if (actualToken == null && authHeader != null && authHeader.startsWith("Bearer ")) {
            actualToken = authHeader.substring(7);
        }

        if (actualToken == null || actualToken.isBlank()) {
            Map<String, String> errorBody = new HashMap<>();
            errorBody.put("error", "No token provided");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body((Object) errorBody);
        }

        try {
            Claims claims = jwtUtil.validateToken(actualToken);
            Long userId = claims.get("uid", Long.class);
            String email = claims.getSubject();

            String newToken = jwtUtil.generateToken(userId, email);
            ResponseCookie cookie = createAuthCookie(newToken);

            log.info("✅ Token refreshed: {} (ID: {})", email, userId);

            AuthResponse authResponse = AuthResponse.builder()
                    .token(newToken)
                    .userId(userId)
                    .email(email)
                    .build();

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body((Object) authResponse);

        } catch (Exception e) {
            log.error("❌ Token refresh failed: {}", e.getMessage());
            Map<String, String> errorBody = new HashMap<>();
            errorBody.put("error", "Invalid or expired token");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body((Object) errorBody);
        }
    }

    /**
     * PUBLIC: Logout
     */
    @PostMapping("/logout")
    public ResponseEntity<Object> logout() {
        log.info("👋 Logout request");

        ResponseCookie cookie = ResponseCookie.from("auth-token", "")
                .httpOnly(true)
                .secure(false) // Set to true in production with HTTPS
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        Map<String, String> body = new HashMap<>();
        body.put("message", "Logged out successfully");

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body((Object) body);
    }

    /**
     * Health check
     */
    @GetMapping("/health")
    public ResponseEntity<Object> health() {
        Map<String, String> body = new HashMap<>();
        body.put("status", "UP");
        body.put("service", "API Gateway - Authentication");
        body.put("timestamp", java.time.Instant.now().toString());
        return ResponseEntity.ok((Object) body);
    }

    /**
     * Create httpOnly cookie for auth token
     */
    private ResponseCookie createAuthCookie(String token) {
        return ResponseCookie.from("auth-token", token)
                .httpOnly(true)
                .secure(false) // Set to true in production with HTTPS
                .path("/")
                .maxAge(Duration.ofHours(24))
                .sameSite("Lax")
                .build();
    }
}