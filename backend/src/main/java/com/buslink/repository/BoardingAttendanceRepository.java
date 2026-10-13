package com.buslink.repository;

import com.buslink.entity.BoardingAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BoardingAttendanceRepository extends JpaRepository<BoardingAttendance, Long> {
    Optional<BoardingAttendance> findByStudentIdAndTripId(Long studentId, Long tripId);
    List<BoardingAttendance> findByStudentId(Long studentId);
    List<BoardingAttendance> findByTripId(Long tripId);
    List<BoardingAttendance> findByBusIdAndDate(Long busId, LocalDate date);
    List<BoardingAttendance> findByStudentIdAndDate(Long studentId, LocalDate date);
}
