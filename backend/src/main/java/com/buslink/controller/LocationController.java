package com.buslink.controller;

import com.buslink.dto.ApiResponse;
import com.buslink.dto.LocationUpdateRequest;
import com.buslink.entity.Bus;
import com.buslink.entity.BusLocationHistory;
import com.buslink.service.LocationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/buses")
public class LocationController {

    @Autowired
    private LocationService locationService;

    @GetMapping("/{busId}/location")
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER', 'STUDENT', 'PARENT')")
    public ResponseEntity<ApiResponse<Bus>> getBusLocation(@PathVariable Long busId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Bus location retrieved", locationService.getBusLocation(busId)));
    }

    @PutMapping("/{busId}/location")
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER')")
    public ResponseEntity<ApiResponse<Bus>> updateBusLocation(@PathVariable Long busId, @Valid @RequestBody LocationUpdateRequest request) {
        Bus bus = locationService.updateBusLocation(busId, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Bus location updated successfully", bus));
    }

    @GetMapping("/{busId}/location/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER', 'STUDENT', 'PARENT')")
    public ResponseEntity<ApiResponse<List<BusLocationHistory>>> getLocationHistory(@PathVariable Long busId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Location history retrieved", locationService.getLocationHistory(busId)));
    }
}
