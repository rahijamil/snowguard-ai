package com.rahi.hazardservice.dto;

import com.rahi.hazardservice.entity.HazardType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HazardSummary {
    private HazardType type;
    private Integer severity; // 0-100
    private String description;
}
