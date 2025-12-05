package com.rahi.userservice.service;

import com.rahi.userservice.dto.RegisterRequest;
import com.rahi.userservice.entity.AccessibilityPreferences;
import com.rahi.userservice.entity.User;
import com.rahi.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User register(RegisterRequest req) {
        log.info("Registering new user: {}", req.getEmail());
        
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }
        
        User user = User.builder()
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .name(req.getName() != null ? req.getName() : req.getEmail().split("@")[0])
                .preferences(AccessibilityPreferences.builder()
                        .fontSize("medium")
                        .highContrast(false)
                        .ttsEnabled(false)
                        .voiceCommands(false)
                        .build())
                .build();
        
        User saved = userRepository.save(user);
        log.info("User registered successfully: {} (ID: {})", saved.getEmail(), saved.getId());
        
        return saved;
    }

    /**
     * Authenticate - NO CACHING
     */
    public User authenticate(String email, String password) {
        log.debug("Authenticating user: {}", email);
        
        Optional<User> userOpt = userRepository.findByEmail(email);
        
        if (userOpt.isEmpty()) {
            log.warn("Authentication failed: User not found - {}", email);
            return null;
        }
        
        User user = userOpt.get();
        
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            log.warn("Authentication failed: Invalid password for user - {}", email);
            return null;
        }
        
        log.info("Authentication successful for user: {} (ID: {})", email, user.getId());
        return user;
    }

    /**
     * Find by email - SIMPLE CACHE KEY
     * Using #p0 (first parameter) instead of #email
     */
    @Cacheable(value = "users", key = "#p0")
    public Optional<User> findByEmail(String email) {
        log.info("🔍 Finding user by email: {} (checking cache)", email);
        Optional<User> user = userRepository.findByEmail(email);
        log.info(user.isPresent() ? "✅ User found: {}" : "❌ User not found: {}", email);
        return user;
    }

    /**
     * Find by ID - SIMPLE CACHE KEY
     * Using #p0 (first parameter) instead of #id
     */
    @Cacheable(value = "users", key = "#p0")
    public Optional<User> findById(Long id) {
        log.info("🔍 Finding user by ID: {} (checking cache)", id);
        Optional<User> user = userRepository.findById(id);
        if (user.isPresent()) {
            log.info("✅ User found: ID={}, Email={}", id, user.get().getEmail());
        } else {
            log.info("❌ User not found with ID: {}", id);
        }
        return user;
    }

    /**
     * Update preferences - CLEAR ALL CACHE
     */
    @Transactional
    @CacheEvict(value = "users", allEntries = true)
    public User updatePreferences(Long userId, AccessibilityPreferences prefs) {
        log.info("🔧 Updating preferences for user ID: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        user.setPreferences(prefs);
        User updated = userRepository.save(user);
        
        log.info("✅ Preferences updated, cache cleared for user: {}", userId);
        
        return updated;
    }

    public boolean emailExists(String email) {
        return userRepository.existsByEmail(email);
    }
}