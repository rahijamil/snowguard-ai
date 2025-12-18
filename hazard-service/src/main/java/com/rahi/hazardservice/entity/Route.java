package com.rahi.hazardservice.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "routes", indexes = {
    @Index(name = "idx_from_to", columnList = "fromLatitude,fromLongitude,toLatitude,toLongitude"),
    @Index(name = "idx_created", columnList = "createdAt"),
    @Index(name = "idx_user_created", columnList = "userId,createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Route {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = true)
    private Long userId;

    @Column(nullable = false)
    private Double fromLatitude;

    @Column(nullable = false)
    private Double fromLongitude;

    @Column(nullable = false)
    private Double toLatitude;

    @Column(nullable = false)
    private Double toLongitude;

    @Column(columnDefinition = "TEXT")
    private String pathJson;

    private Integer riskScore;
    private Double distanceMeters;
    private Integer durationSeconds;

    @Column(columnDefinition = "TEXT")
    private String hazardHotspotsJson;

    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}