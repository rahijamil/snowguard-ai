// ===== UserDto.java =====
package com.rahi.userservice.dto;

import com.rahi.userservice.entity.AccessibilityPreferences;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String email;
    private String name;
    private AccessibilityPreferences preferences;
    private LocalDateTime createdAt;
}