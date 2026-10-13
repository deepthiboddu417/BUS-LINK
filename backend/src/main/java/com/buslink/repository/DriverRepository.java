package com.buslink.repository;

import com.buslink.entity.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {
    Optional<Driver> findByUserEmail(String email);
    Optional<Driver> findByUserId(Long userId);
}
