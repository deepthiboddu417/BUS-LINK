package com.buslink.controller;

import com.buslink.dto.ApiResponse;
import com.buslink.dto.LocationUpdateRequest;
import com.buslink.entity.Bus;
import com.buslink.entity.BusLocationHistory;
import com.buslink.entity.Route;
import com.buslink.service.TrackingService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tracking")
public class TrackingController {

    @Autowired
    private TrackingService trackingService;

    @PostMapping("/location")
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER')")
    public ResponseEntity<ApiResponse<Bus>> submitDriverLocation(@Valid @RequestBody LocationUpdateRequest request) {
        Bus updatedBus = trackingService.submitDriverLocation(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Live GPS location recorded successfully", updatedBus));
    }

    @GetMapping("/buses/{busId}/latest")
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER', 'STUDENT', 'PARENT')")
    public ResponseEntity<ApiResponse<Bus>> getLatestBusLocation(@PathVariable Long busId) {
        Bus bus = trackingService.getLatestBusLocation(busId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Latest bus location retrieved", bus));
    }

    @GetMapping("/buses/{busId}/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER', 'STUDENT', 'PARENT')")
    public ResponseEntity<ApiResponse<List<BusLocationHistory>>> getLocationHistory(
            @PathVariable Long busId,
            @RequestParam(defaultValue = "50") int limit) {
        List<BusLocationHistory> history = trackingService.getLocationHistory(busId, limit);
        return ResponseEntity.ok(new ApiResponse<>(true, "Bus location history retrieved", history));
    }

    @GetMapping("/buses/{busId}/route")
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER', 'STUDENT', 'PARENT')")
    public ResponseEntity<ApiResponse<Route>> getBusRoute(@PathVariable Long busId) {
        Route route = trackingService.getBusRoute(busId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Bus route configuration retrieved", route));
    }

    @GetMapping("/buses/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER', 'STUDENT', 'PARENT')")
    public ResponseEntity<ApiResponse<List<Bus>>> getActiveBuses() {
        List<Bus> buses = trackingService.getActiveBuses();
        return ResponseEntity.ok(new ApiResponse<>(true, "Active buses retrieved", buses));
    }

    @PostMapping("/simulation/start")
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> startSimulation(@RequestBody Map<String, Object> body) {
        Long busId = body.get("busId") != null ? Long.parseLong(body.get("busId").toString()) : 1L;
        Map<String, Object> result = trackingService.startSimulation(busId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Simulation started", result));
    }

    @PostMapping("/simulation/stop")
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> stopSimulation(@RequestBody Map<String, Object> body) {
        Long busId = body.get("busId") != null ? Long.parseLong(body.get("busId").toString()) : 1L;
        Map<String, Object> result = trackingService.stopSimulation(busId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Simulation stopped", result));
    }

    @GetMapping("/simulation/status/{busId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER', 'STUDENT', 'PARENT')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSimulationStatus(@PathVariable Long busId) {
        Map<String, Object> status = trackingService.getSimulationStatus(busId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Simulation status retrieved", status));
    }
}
