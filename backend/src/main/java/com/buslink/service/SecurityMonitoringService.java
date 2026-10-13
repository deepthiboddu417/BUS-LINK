package com.buslink.service;

import com.buslink.entity.SecurityEvent;
import com.buslink.entity.SuspiciousLocationEvent;
import com.buslink.repository.AuditLogRepository;
import com.buslink.repository.EmergencyAlertRepository;
import com.buslink.repository.SecurityEventRepository;
import com.buslink.repository.SuspiciousLocationEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class SecurityMonitoringService {

    @Autowired
    private SecurityEventRepository securityEventRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private SuspiciousLocationEventRepository suspiciousLocationEventRepository;

    @Autowired
    private EmergencyAlertRepository emergencyAlertRepository;

    public Map<String, Object> getSecurityMetrics() {
        Map<String, Object> metrics = new HashMap<>();

        long totalFailedLogins = securityEventRepository.countByEventType("LOGIN_FAILED");
        long totalAccountLocks = securityEventRepository.countByEventType("ACCOUNT_LOCKED");
        long totalRateLimitExceeded = securityEventRepository.countByEventType("RATE_LIMIT_EXCEEDED");
        long totalAccessDenied = auditLogRepository.countByResult("DENIED");
        long activeSuspiciousLocations = suspiciousLocationEventRepository.countByStatus("FLAGGED");
        long totalEmergencies = emergencyAlertRepository.count();

        metrics.put("totalFailedLogins", totalFailedLogins);
        metrics.put("totalAccountLocks", totalAccountLocks);
        metrics.put("totalRateLimitExceeded", totalRateLimitExceeded);
        metrics.put("totalAccessDenied", totalAccessDenied);
        metrics.put("activeSuspiciousLocations", activeSuspiciousLocations);
        metrics.put("totalEmergencies", totalEmergencies);

        List<SecurityEvent> recentEvents = securityEventRepository.findTop50ByOrderByTimestampDesc();
        metrics.put("recentSecurityEvents", recentEvents);

        List<SuspiciousLocationEvent> recentSuspiciousLocations = suspiciousLocationEventRepository.findTop50ByOrderByTimestampDesc();
        metrics.put("recentSuspiciousLocations", recentSuspiciousLocations);

        return metrics;
    }
}
