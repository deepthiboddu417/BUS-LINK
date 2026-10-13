package com.buslink.controller;

import com.buslink.dto.ApiResponse;
import com.buslink.entity.Incident;
import com.buslink.service.IncidentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    @Autowired
    private IncidentService incidentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER', 'STUDENT', 'PARENT')")
    public ResponseEntity<ApiResponse<List<Incident>>> getAllIncidents() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Incidents retrieved", incidentService.getAllIncidents()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER', 'STUDENT', 'PARENT')")
    public ResponseEntity<ApiResponse<Incident>> reportIncident(@RequestBody Incident incident, HttpServletRequest request) {
        String clientIp = request.getRemoteAddr();
        return ResponseEntity.ok(new ApiResponse<>(true, "Incident reported successfully", incidentService.reportIncident(incident, clientIp)));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Incident>> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body, HttpServletRequest request) {
        String status = body.get("status");
        String clientIp = request.getRemoteAddr();
        return ResponseEntity.ok(new ApiResponse<>(true, "Incident status updated", incidentService.updateIncidentStatus(id, status, clientIp)));
    }
}
