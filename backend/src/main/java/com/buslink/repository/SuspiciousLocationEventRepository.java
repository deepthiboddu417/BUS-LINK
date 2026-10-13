package com.buslink.repository;

import com.buslink.entity.SuspiciousLocationEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SuspiciousLocationEventRepository extends JpaRepository<SuspiciousLocationEvent, Long> {
    List<SuspiciousLocationEvent> findTop50ByOrderByTimestampDesc();
    long countByStatus(String status);
}
