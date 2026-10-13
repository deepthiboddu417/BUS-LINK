package com.buslink.repository;

import com.buslink.entity.SecurityEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SecurityEventRepository extends JpaRepository<SecurityEvent, Long> {
    List<SecurityEvent> findTop50ByOrderByTimestampDesc();
    long countByEventType(String eventType);
    long countByEventTypeAndTimestampAfter(String eventType, LocalDateTime timestamp);
}
