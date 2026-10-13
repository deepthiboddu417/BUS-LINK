package com.buslink.controller;

import com.buslink.dto.ApiResponse;
import com.buslink.entity.AuditLog;
import com.buslink.service.AuditLogService;
import com.buslink.service.SecurityMonitoringService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/security")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSecurityController {

    @Autowired
    private SecurityMonitoringService securityMonitoringService;

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSecurityMetrics() {
        Map<String, Object> metrics = securityMonitoringService.getSecurityMetrics();
        return ResponseEntity.ok(new ApiResponse<>(true, "Security metrics retrieved successfully", metrics));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getAuditLogs(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String result,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {

        List<AuditLog> logs = auditLogService.filterLogs(role, result, action, start, end);
        return ResponseEntity.ok(new ApiResponse<>(true, "Audit logs retrieved successfully", logs));
    }
}
