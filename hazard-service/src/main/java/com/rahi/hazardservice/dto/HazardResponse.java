package com.rahi.hazardservice.dto;

import com.rahi.hazardservice.entity.HazardType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HazardResponse {
    private LocationDto location;
    private List<HazardSummary> hazardSummary;
    private Instant timestamp;
    private String warning; // Optional high-level warning message
}