package com.buslink.controller;

import com.buslink.dto.ApiResponse;
import com.buslink.entity.TripStatus;
import com.buslink.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private ParentRepository parentRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private BusRepository busRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private BoardingAttendanceRepository boardingRepository;

    @Autowired
    private EmergencyAlertRepository emergencyRepository;

    @GetMapping("/dashboard-stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalStudents", studentRepository.count());
        stats.put("totalParents", parentRepository.count());
        stats.put("totalDrivers", driverRepository.count());
        stats.put("totalBuses", busRepository.count());
        stats.put("activeTrips", tripRepository.findByStatus(TripStatus.IN_TRANSIT).size());
        stats.put("studentsBoardedToday", boardingRepository.findAll().stream()
                .filter(b -> LocalDate.now().equals(b.getDate())).count());
        stats.put("emergencyAlertsCount", emergencyRepository.findAllByOrderByCreatedAtDesc().size());

        return ResponseEntity.ok(new ApiResponse<>(true, "Dashboard stats retrieved", stats));
    }
}
