package com.rahi.hazardservice.repository;

import com.rahi.hazardservice.entity.Hazard;
import com.rahi.hazardservice.entity.HazardType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface HazardRepository extends JpaRepository<Hazard, Long> {
    
    // Find hazards within a bounding box (simplified geospatial query)
    @Query("SELECT h FROM Hazard h WHERE " +
           "h.latitude BETWEEN :minLat AND :maxLat AND " +
           "h.longitude BETWEEN :minLon AND :maxLon AND " +
           "h.timestamp > :since")
    List<Hazard> findWithinBounds(
        @Param("minLat") Double minLat,
        @Param("maxLat") Double maxLat,
        @Param("minLon") Double minLon,
        @Param("maxLon") Double maxLon,
        @Param("since") Instant since
    );

    List<Hazard> findByHazardTypeAndTimestampAfter(HazardType type, Instant since);

    @Query("SELECT h FROM Hazard h WHERE h.timestamp BETWEEN :start AND :end " +
           "AND h.latitude BETWEEN :minLat AND :maxLat " +
           "AND h.longitude BETWEEN :minLon AND :maxLon " +
           "ORDER BY h.timestamp DESC")
    List<Hazard> findHistoricalHazards(
        @Param("minLat") Double minLat,
        @Param("maxLat") Double maxLat,
        @Param("minLon") Double minLon,
        @Param("maxLon") Double maxLon,
        @Param("start") Instant start,
        @Param("end") Instant end
    );

    void deleteByTimestampBefore(Instant cutoff);
}