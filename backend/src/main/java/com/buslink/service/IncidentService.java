package com.buslink.service;

import com.buslink.entity.Incident;
import com.buslink.exception.ResourceNotFoundException;
import com.buslink.repository.IncidentRepository;
import com.buslink.security.SecurityUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class IncidentService {

    @Autowired
    private IncidentRepository incidentRepository;

    @Autowired
    private AuditLogService auditLogService;

    public List<Incident> getAllIncidents() {
        return incidentRepository.findAllByOrderByCreatedAtDesc();
    }

    public Incident getIncidentById(Long id) {
        return incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found with id: " + id));
    }

    @Transactional
    public Incident reportIncident(Incident incident, String clientIp) {
        String username = SecurityUtil.getCurrentUserEmail();
        if (username != null && incident.getReporterEmail() == null) {
            incident.setReporterEmail(username);
        }
        Incident saved = incidentRepository.save(incident);
        auditLogService.logAction(null, incident.getReporterEmail(), "USER", "INCIDENT_REPORTED", "Incident", saved.getId().toString(), clientIp, "SUCCESS", "Incident reported: " + saved.getCategory());
        return saved;
    }

    @Transactional
    public Incident updateIncidentStatus(Long id, String status, String clientIp) {
        Incident incident = getIncidentById(id);
        incident.setStatus(status);
        Incident updated = incidentRepository.save(incident);
        auditLogService.logAction(null, SecurityUtil.getCurrentUserEmail(), "ADMIN", "INCIDENT_STATUS_UPDATED", "Incident", id.toString(), clientIp, "SUCCESS", "Incident status changed to: " + status);
        return updated;
    }
}
