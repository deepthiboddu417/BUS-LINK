package com.buslink.repository;

import com.buslink.entity.Bus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BusRepository extends JpaRepository<Bus, Long> {
    Optional<Bus> findByBusNumber(String busNumber);
    Optional<Bus> findByDriverId(Long driverId);
    Optional<Bus> findByDriverUserEmail(String email);
}
