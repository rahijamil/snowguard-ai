
// ===== UserController.java - UPDATED =====
package com.rahi.userservice.controller;

import com.rahi.userservice.dto.UserDto;
import com.rahi.userservice.entity.AccessibilityPreferences;
import com.rahi.userservice.entity.User;
import com.rahi.userservice.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * User management endpoints (NOT authentication)
 * Requires authentication from API Gateway
 */
@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * Get current user profile
     * Uses X-User-Id or X-User-Email header from Gateway
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Email", required = false) String email) {

        log.info("📋 Get current user - userId: {}, email: {}", userId, email);

        if (userId == null && email == null) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Unauthorized - No user context"));
        }

        try {
            User user;

            if (userId != null) {

user = userService.findById(Long.parseLong(userId))
.orElseThrow(() -> new RuntimeException("User not found"));

            } else {

                       user = userService.findByEmail(email) .orElseThrow(() -> new RuntimeException("User not found"));

            }

            UserDto dto = UserDto.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .name(user.getName())
                    .preferences(user.getPreferences())
                    .createdAt(user.getCreatedAt())
                    .build();

            return ResponseEntity.ok(dto);

        } catch (Exception e) {
            log.error("❌ Error getting user: {}", e.getMessage());
            return ResponseEntity.status(404)
                    .body(Map.of("error", "User not found"));
        }
    }

    /**
     * Get user by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable("id") Long id) {
        log.info("📋 Get user by ID: {}", id);

        try {
         
User user = userService.findById(id)
.orElseThrow(() -> new RuntimeException("User not found"));

            UserDto dto = UserDto.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .name(user.getName())
                    .preferences(user.getPreferences())
                    .createdAt(user.getCreatedAt())
                    .build();

            return ResponseEntity.ok(dto);

        } catch (Exception e) {
            log.error("❌ Error getting user {}: {}", id, e.getMessage());
            return ResponseEntity.status(404)
                    .body(Map.of("error", "User not found"));
        }
    }

    /**
     * Update user preferences
     */
    @PutMapping("/{id}/preferences")
    public ResponseEntity<?> updatePreferences(
            @PathVariable("id") Long id,
            @RequestBody AccessibilityPreferences prefs,
            @RequestHeader(value = "X-User-Id", required = false) String requestingUserId) {

        log.info("🔧 Update preferences for user {}", id);

        // Optional: Verify user can only update their own preferences
        if (requestingUserId != null && !requestingUserId.equals(id.toString())) {
            log.warn("⚠️ User {} attempted to update preferences for user {}",
                    requestingUserId, id);
            return ResponseEntity.status(403)
                    .body(Map.of("error", "Forbidden - Can only update own preferences"));
        }

        try {
            User updated = userService.updatePreferences(id, prefs);

            return ResponseEntity.ok(Map.of(
                    "message", "Preferences updated successfully",
                    "preferences", updated.getPreferences()));

        } catch (IllegalArgumentException e) {
            log.error("❌ User {} not found", id);
            return ResponseEntity.status(404)
                    .body(Map.of("error", "User not found"));
        } catch (Exception e) {
            log.error("❌ Error updating preferences: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Failed to update preferences"));
        }
    }

    /**
     * Health check
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "User Service - User Management",
                "timestamp", java.time.Instant.now().toString()));
    }
}