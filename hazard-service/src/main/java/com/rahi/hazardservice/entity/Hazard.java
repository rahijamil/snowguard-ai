package com.rahi.hazardservice.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "hazards", indexes = {
    @Index(name = "idx_lat_lon", columnList = "latitude,longitude"),
    @Index(name = "idx_timestamp", columnList = "timestamp")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Hazard {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private HazardType hazardType;

    @Column(nullable = false)
    private Integer severity; // 0-100 scale

    private String source; // e.g., "openweather", "manual"

    @Column(nullable = false)
    private Instant timestamp;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Double temperature; // Celsius
    private Double windSpeed; // m/s
    private Double precipitation; // mm
    private Double visibility; // meters

    @PrePersist
    public void prePersist() {
        if (timestamp == null) {
            timestamp = Instant.now();
        }
    }
}