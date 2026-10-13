package com.buslink.controller;

import com.buslink.dto.ApiResponse;
import com.buslink.dto.EmergencyRequest;
import com.buslink.entity.EmergencyAlert;
import com.buslink.service.EmergencyService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/emergency")
public class EmergencyController {

    @Autowired
    private EmergencyService emergencyService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER', 'STUDENT', 'PARENT')")
    public ResponseEntity<ApiResponse<EmergencyAlert>> raiseEmergency(@RequestParam(required = false) Long userId,
                                                                       @Valid @RequestBody EmergencyRequest request) {
        Long targetUserId = (userId != null) ? userId : 1L;
        EmergencyAlert alert = emergencyService.raiseEmergency(targetUserId, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Emergency alert broadcasted!", alert));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER', 'PARENT')")
    public ResponseEntity<ApiResponse<List<EmergencyAlert>>> getAllAlerts() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Emergency alerts retrieved", emergencyService.getAllAlerts()));
    }

    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<EmergencyAlert>> resolveAlert(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Emergency alert resolved", emergencyService.resolveAlert(id)));
    }
}
