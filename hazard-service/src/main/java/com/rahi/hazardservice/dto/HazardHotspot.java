package com.rahi.hazardservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HazardHotspot {
    private Double lat;
    private Double lon;
    private Integer severity;
    private String hazardType;
}
