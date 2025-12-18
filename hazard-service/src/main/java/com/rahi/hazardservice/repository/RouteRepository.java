package com.rahi.hazardservice.repository;

import com.rahi.hazardservice.entity.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface RouteRepository extends JpaRepository<Route, Long> {
    
    // Find cached route for specific user and coordinates
    @Query("SELECT r FROM Route r WHERE " +
           "r.userId = :userId AND " +
           "r.fromLatitude = :fromLat AND r.fromLongitude = :fromLon AND " +
           "r.toLatitude = :toLat AND r.toLongitude = :toLon AND " +
           "r.createdAt > :since " +
           "ORDER BY r.createdAt DESC")
    Optional<Route> findRecentRouteForUser(
        @Param("userId") Long userId,
        @Param("fromLat") Double fromLat,
        @Param("fromLon") Double fromLon,
        @Param("toLat") Double toLat,
        @Param("toLon") Double toLon,
        @Param("since") Instant since
    );

    // Find all routes for a user since a date
    @Query("SELECT r FROM Route r WHERE " +
           "r.userId = :userId AND r.createdAt > :since " +
           "ORDER BY r.createdAt DESC")
    List<Route> findByUserIdAndCreatedAtAfter(
        @Param("userId") Long userId, 
        @Param("since") Instant since
    );

    // Find all recent routes (for all users or anonymous)
    @Query("SELECT r FROM Route r WHERE r.createdAt > :since ORDER BY r.createdAt DESC")
    List<Route> findRecentRoutes(@Param("since") Instant since);

    // Cleanup old routes
    void deleteByCreatedAtBefore(Instant cutoff);
    
    // Delete old routes for specific user
    void deleteByUserIdAndCreatedAtBefore(Long userId, Instant cutoff);
}