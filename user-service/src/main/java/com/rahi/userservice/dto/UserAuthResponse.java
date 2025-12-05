// ===== UserAuthResponse.java - NEW DTO =====
package com.rahi.userservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response for internal auth operations
 * Does NOT include JWT token (Gateway handles that)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAuthResponse {
    private Long userId;
    private String email;
    private String name;
}