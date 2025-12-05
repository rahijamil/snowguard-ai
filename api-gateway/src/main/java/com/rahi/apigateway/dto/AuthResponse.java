package com.rahi.apigateway.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)  // Don't include null fields in JSON
public class AuthResponse {
    private String token;    // JWT token
    private Long userId;
    private String email;
    private String name;
    private String error;    // Error message if auth failed
}