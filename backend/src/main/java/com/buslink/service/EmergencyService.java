package com.buslink.service;

import com.buslink.dto.EmergencyRequest;
import com.buslink.entity.*;
import com.buslink.exception.ResourceNotFoundException;
import com.buslink.exception.UnauthorizedAccessException;
import com.buslink.repository.*;
import com.buslink.security.SecurityUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EmergencyService {

    @Autowired
    private EmergencyAlertRepository emergencyAlertRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private BusRepository busRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AuditLogService auditLogService;

    @Transactional
    public EmergencyAlert raiseEmergency(Long userId, EmergencyRequest request) {
        Student student = studentRepository.findByUserEmail(userId != null ? userId.toString() : "")
                .or(() -> userId != null ? studentRepository.findById(userId) : java.util.Optional.empty()).orElse(null);
        Driver driver = driverRepository.findByUserEmail(userId != null ? userId.toString() : "")
                .or(() -> userId != null ? driverRepository.findById(userId) : java.util.Optional.empty()).orElse(null);

        Bus bus = null;
        if (request.getBusId() != null) {
            bus = busRepository.findById(request.getBusId()).orElse(null);
        } else if (student != null && student.getBus() != null) {
            bus = student.getBus();
        } else if (driver != null) {
            bus = busRepository.findByDriverId(driver.getId()).orElse(null);
        }

        // Driver authorization check
        if (SecurityUtil.hasRole("DRIVER") && !SecurityUtil.isAdmin()) {
            String currentEmail = SecurityUtil.getCurrentUserEmail();
            if (bus != null && bus.getDriver() != null && bus.getDriver().getUser() != null &&
                    !bus.getDriver().getUser().getEmail().equalsIgnoreCase(currentEmail)) {
                throw new UnauthorizedAccessException("Access Denied: Driver cannot raise emergency for another driver's bus");
            }
        }

        String alertType = request.getMessage() != null && request.getMessage().toUpperCase().contains("MEDICAL") ? "MEDICAL"
                : request.getMessage() != null && request.getMessage().toUpperCase().contains("ACCIDENT") ? "ACCIDENT"
                : request.getMessage() != null && request.getMessage().toUpperCase().contains("BREAKDOWN") ? "BREAKDOWN"
                : "SECURITY";

        EmergencyAlert alert = new EmergencyAlert(
                student, driver, bus,
                request.getMessage() != null ? request.getMessage() : "EMERGENCY ALERT: Urgent assistance requested!",
                alertType, "PENDING", request.getLatitude(), request.getLongitude()
        );
        alert = emergencyAlertRepository.save(alert);

        auditLogService.logUserAction(SecurityUtil.getCurrentUserPrincipal(), "EMERGENCY_CREATED", "EmergencyAlert", alert.getId().toString(), null, "SUCCESS", "Emergency alert raised: " + alert.getMessage());

        // Notify linked parents
        if (bus != null) {
            List<Student> passengers = studentRepository.findByBusId(bus.getId());
            for (Student s : passengers) {
                if (s.getParent() != null) {
                    String parentMsg = "🚨 EMERGENCY ALERT: Emergency reported on Bus " + bus.getBusNumber() + " (" + alert.getType() + "). Details: " + alert.getMessage();
                    notificationService.createNotification(s.getParent(), s, parentMsg, NotificationType.EMERGENCY);
                }
            }
        }

        return alert;
    }

    public List<EmergencyAlert> getAllAlerts() {
        return emergencyAlertRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public EmergencyAlert resolveAlert(Long alertId) {
        EmergencyAlert alert = emergencyAlertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency alert not found with id: " + alertId));

        alert.setStatus("RESOLVED");
        alert.setResolvedBy(SecurityUtil.getCurrentUserEmail());
        alert.setResolvedAt(LocalDateTime.now());
        alert = emergencyAlertRepository.save(alert);

        auditLogService.logUserAction(SecurityUtil.getCurrentUserPrincipal(), "EMERGENCY_RESOLVED", "EmergencyAlert", alertId.toString(), null, "SUCCESS", "Emergency alert marked RESOLVED");
        return alert;
    }
}
