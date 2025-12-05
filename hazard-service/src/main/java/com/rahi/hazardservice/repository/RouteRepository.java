
package com.rahi.hazardservice.repository;

import com.rahi.hazardservice.entity.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.List;

public interface RouteRepository extends JpaRepository<Route, Long> {
    
   @Query("SELECT r FROM Route r WHERE " +
           "r.fromLatitude = :fromLat AND r.fromLongitude = :fromLon AND " +
           "r.toLatitude = :toLat AND r.toLongitude = :toLon AND " +
           "r.createdAt > :since " +
           "ORDER BY r.createdAt DESC LIMIT 1")
    Optional<Route> findRecentRoute(
        @Param("fromLat") Double fromLat,
        @Param("fromLon") Double fromLon,
        @Param("toLat") Double toLat,
        @Param("toLon") Double toLon,
        @Param("since") Instant since
    );

    @Query("SELECT r FROM Route r WHERE r.createdAt > :since ORDER BY r.createdAt DESC")
    List<Route> findRecentRoute(@Param("since") Instant since);

    void deleteByCreatedAtBefore(Instant cutoff);
}