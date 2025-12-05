
package com.rahi.hazardservice.config;

import com.rahi.hazardservice.repository.HazardRepository;
import com.rahi.hazardservice.repository.RouteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataCleanupScheduler {

    private final HazardRepository hazardRepository;
    private final RouteRepository routeRepository;

    // Clean up old hazards daily at 2 AM
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupOldHazards() {
        Instant cutoff = Instant.now().minus(7, ChronoUnit.DAYS);
        log.info("Cleaning up hazards older than {}", cutoff);
        hazardRepository.deleteByTimestampBefore(cutoff);
    }

    // Clean up old routes daily at 3 AM
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupOldRoutes() {
        Instant cutoff = Instant.now().minus(1, ChronoUnit.DAYS);
        log.info("Cleaning up routes older than {}", cutoff);
        routeRepository.deleteByCreatedAtBefore(cutoff);
    }
}