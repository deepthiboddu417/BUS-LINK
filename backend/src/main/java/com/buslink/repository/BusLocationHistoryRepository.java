package com.buslink.repository;

import com.buslink.entity.BusLocationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BusLocationHistoryRepository extends JpaRepository<BusLocationHistory, Long> {
    @org.springframework.data.jpa.repository.Query("SELECT h FROM BusLocationHistory h WHERE h.bus.id = :busId ORDER BY h.timestamp DESC")
    List<BusLocationHistory> findByBusIdOrderByTimestampDesc(@org.springframework.data.repository.query.Param("busId") Long busId);
}
