package com.buslink.repository;

import com.buslink.entity.Trip;
import com.buslink.entity.TripStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByBusId(Long busId);
    Optional<Trip> findTopByBusIdAndStatusInOrderByStartTimeDesc(Long busId, List<TripStatus> statuses);
    Optional<Trip> findTopByBusIdOrderByStartTimeDesc(Long busId);
    List<Trip> findByStatus(TripStatus status);
}
