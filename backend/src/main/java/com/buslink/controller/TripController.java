package com.buslink.controller;

import com.buslink.dto.ApiResponse;
import com.buslink.entity.Trip;
import com.buslink.service.TripService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trips")
public class TripController {

    @Autowired
    private TripService tripService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER')")
    public ResponseEntity<ApiResponse<List<Trip>>> getAllTrips() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Trips retrieved", tripService.getAllTrips()));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER', 'STUDENT', 'PARENT')")
    public ResponseEntity<ApiResponse<List<Trip>>> getActiveTrips() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Active trips retrieved", tripService.getActiveTrips()));
    }

    @GetMapping("/bus/{busId}/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER', 'STUDENT', 'PARENT')")
    public ResponseEntity<ApiResponse<Trip>> getActiveTripForBus(@PathVariable Long busId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Active trip for bus retrieved", tripService.getActiveTripForBus(busId)));
    }

    @PutMapping("/bus/{busId}/start")
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER')")
    public ResponseEntity<ApiResponse<Trip>> startTrip(@PathVariable Long busId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Trip started successfully", tripService.startTrip(busId)));
    }

    @PutMapping("/{id}/end")
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER')")
    public ResponseEntity<ApiResponse<Trip>> endTrip(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Trip completed successfully", tripService.endTrip(id)));
    }
}
