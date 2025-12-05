package com.rahi.hazardservice.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class ValidationService {

    private static final double MIN_LATITUDE = -90.0;
    private static final double MAX_LATITUDE = 90.0;
    private static final double MIN_LONGITUDE = -180.0;
    private static final double MAX_LONGITUDE = 180.0;
    private static final double MIN_RADIUS = 0.1;
    private static final double MAX_RADIUS = 100.0;
    private static final int MIN_DAYS = 1;
    private static final int MAX_DAYS = 90;

    public void validateLatitude(Double lat, String paramName) {
        if (lat == null) {
            throw new IllegalArgumentException(paramName + " cannot be null");
        }
        if (lat < MIN_LATITUDE || lat > MAX_LATITUDE) {
            throw new IllegalArgumentException(
                String.format("%s must be between %.1f and %.1f, got: %.6f", 
                    paramName, MIN_LATITUDE, MAX_LATITUDE, lat));
        }
    }

    public void validateLongitude(Double lon, String paramName) {
        if (lon == null) {
            throw new IllegalArgumentException(paramName + " cannot be null");
        }
        if (lon < MIN_LONGITUDE || lon > MAX_LONGITUDE) {
            throw new IllegalArgumentException(
                String.format("%s must be between %.1f and %.1f, got: %.6f", 
                    paramName, MIN_LONGITUDE, MAX_LONGITUDE, lon));
        }
    }

    public void validateRadius(Double radius) {
        if (radius != null && (radius < MIN_RADIUS || radius > MAX_RADIUS)) {
            throw new IllegalArgumentException(
                String.format("Radius must be between %.1f and %.1f km, got: %.2f", 
                    MIN_RADIUS, MAX_RADIUS, radius));
        }
    }

    public void validateDays(Integer days) {
        if (days != null && (days < MIN_DAYS || days > MAX_DAYS)) {
            throw new IllegalArgumentException(
                String.format("Days must be between %d and %d, got: %d", 
                    MIN_DAYS, MAX_DAYS, days));
        }
    }

    public void validateCoordinates(Double lat, Double lon, String context) {
        validateLatitude(lat, context + " latitude");
        validateLongitude(lon, context + " longitude");
    }

    public void validateRouteCoordinates(Double fromLat, Double fromLon, 
                                        Double toLat, Double toLon) {
        if (fromLat == null || fromLon == null || toLat == null || toLon == null) {
            throw new IllegalArgumentException("All route coordinates (fromLat, fromLon, toLat, toLon) are required");
        }
        
        validateCoordinates(fromLat, fromLon, "From");
        validateCoordinates(toLat, toLon, "To");
        
        // Check if start and end are the same
        if (fromLat.equals(toLat) && fromLon.equals(toLon)) {
            throw new IllegalArgumentException("Start and end coordinates cannot be the same");
        }
        
        // Check if route is too long (> 50km straight line distance)
        double distance = calculateDistanceKm(fromLat, fromLon, toLat, toLon);
        if (distance > 50.0) {
            throw new IllegalArgumentException(
                String.format("Route is too long (%.2f km). Maximum distance is 50 km", distance));
        }
    }

    private double calculateDistanceKm(Double lat1, Double lon1, Double lat2, Double lon2) {
        double R = 6371; // Earth radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}