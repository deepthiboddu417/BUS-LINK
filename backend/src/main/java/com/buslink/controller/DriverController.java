package com.buslink.controller;

import com.buslink.dto.ApiResponse;
import com.buslink.entity.Driver;
import com.buslink.service.DriverService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drivers")
public class DriverController {

    @Autowired
    private DriverService driverService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Driver>>> getAllDrivers() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Drivers retrieved", driverService.getAllDrivers()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER')")
    public ResponseEntity<ApiResponse<Driver>> getDriverById(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Driver retrieved", driverService.getDriverById(id)));
    }

    @GetMapping("/email/{email}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER')")
    public ResponseEntity<ApiResponse<Driver>> getDriverByEmail(@PathVariable String email) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Driver retrieved", driverService.getDriverByEmail(email)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER')")
    public ResponseEntity<ApiResponse<Driver>> updateDriver(@PathVariable Long id, @RequestBody Driver driver) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Driver updated", driverService.updateDriver(id, driver)));
    }

    @Autowired
    private com.buslink.service.BoardingService boardingService;

    @PostMapping("/attendance/scan")
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER')")
    public ResponseEntity<ApiResponse<com.buslink.entity.BoardingAttendance>> scanDriverAttendance(@RequestBody com.buslink.dto.DriverScanRequest request) {
        com.buslink.entity.BoardingAttendance attendance = boardingService.recordDriverScan(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "✓ QR Boarding Attendance Verified & Confirmed", attendance));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteDriver(@PathVariable Long id) {
        driverService.deleteDriver(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Driver deleted"));
    }
}
