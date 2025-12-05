package com.rahi.apigateway.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    private Long userId;
    private String userName;
    private Map<String, Double> location;
    private JsonNode preferences;
    private JsonNode hazards;
    private String aiSuggestions;
    private String timestamp;
    private String error;
}