package com.buslink.controller;

import com.buslink.dto.ApiResponse;
import com.buslink.entity.Bus;
import com.buslink.service.BusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/buses")
public class BusController {

    @Autowired
    private BusService busService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER', 'STUDENT', 'PARENT')")
    public ResponseEntity<ApiResponse<List<Bus>>> getAllBuses() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Buses retrieved", busService.getAllBuses()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER', 'STUDENT', 'PARENT')")
    public ResponseEntity<ApiResponse<Bus>> getBusById(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Bus details retrieved", busService.getBusById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Bus>> createBus(@RequestBody Bus bus) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Bus created successfully", busService.createBus(bus)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Bus>> updateBus(@PathVariable Long id, @RequestBody Bus bus) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Bus updated successfully", busService.updateBus(id, bus)));
    }

    @PutMapping("/{id}/assign-driver/{driverId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Bus>> assignDriver(@PathVariable Long id, @PathVariable Long driverId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Driver assigned to bus", busService.assignDriver(id, driverId)));
    }

    @PutMapping("/{id}/assign-route/{routeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Bus>> assignRoute(@PathVariable Long id, @PathVariable Long routeId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Route assigned to bus", busService.assignRoute(id, routeId)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteBus(@PathVariable Long id) {
        busService.deleteBus(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Bus deleted successfully"));
    }
}
