package com.rahi.hazardservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteResponse {
    private List<LocationDto> path;
    private Double distanceMeters;
    private Integer durationSeconds;
    private Integer riskScore; // 0-100
    private List<HazardHotspot> hazardHotspots;
    private String recommendation; // AI-friendly route advice
}