package com.rahi.hazardservice.dto;

import lombok.Data;

@Data
public class WeatherData {
    private Double temperature;
    private String weatherCondition;
    private Double windSpeed;
    private Double precipitation;
    private Double visibility;
    private Integer humidity;
    private String description;
}