package com.buslink.service;

import com.buslink.entity.AuditLog;
import com.buslink.repository.AuditLogRepository;
import com.buslink.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Transactional
    public void logAction(Long userId, String username, String role, String action, String resourceType, String resourceId, String ipAddress, String result, String description) {
        try {
            AuditLog log = new AuditLog(userId, username, role, action, resourceType, resourceId, ipAddress, result, description);
            auditLogRepository.save(log);
        } catch (Exception e) {
            // Log silently to avoid breaking application flow
            System.err.println("Failed to save audit log: " + e.getMessage());
        }
    }

    public void logUserAction(UserPrincipal principal, String action, String resourceType, String resourceId, String ipAddress, String result, String description) {
        if (principal != null) {
            String role = principal.getAuthorities().isEmpty() ? "ROLE_USER" : principal.getAuthorities().iterator().next().getAuthority();
            logAction(principal.getId(), principal.getUsername(), role, action, resourceType, resourceId, ipAddress, result, description);
        } else {
            logAction(null, "anonymous", "ANONYMOUS", action, resourceType, resourceId, ipAddress, result, description);
        }
    }

    public List<AuditLog> getRecentLogs() {
        return auditLogRepository.findTop100ByOrderByTimestampDesc();
    }

    public List<AuditLog> filterLogs(String role, String result, String action, LocalDateTime start, LocalDateTime end) {
        if (role != null && !role.isBlank()) {
            return auditLogRepository.findByRoleOrderByTimestampDesc(role);
        }
        if (result != null && !result.isBlank()) {
            return auditLogRepository.findByResultOrderByTimestampDesc(result);
        }
        if (action != null && !action.isBlank()) {
            return auditLogRepository.findByActionOrderByTimestampDesc(action);
        }
        if (start != null && end != null) {
            return auditLogRepository.findByTimestampBetweenOrderByTimestampDesc(start, end);
        }
        return auditLogRepository.findTop100ByOrderByTimestampDesc();
    }
}
