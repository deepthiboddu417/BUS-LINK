package com.buslink.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "security_events")
public class SecurityEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String eventType; // LOGIN_FAILED, ACCOUNT_LOCKED, RATE_LIMIT_EXCEEDED, UNAUTHORIZED_ACCESS, SUSPICIOUS_GPS

    private Long userId;

    private String ipAddress;

    private String severity; // HIGH, MEDIUM, LOW

    private LocalDateTime timestamp;

    @Column(length = 1000)
    private String details;

    public SecurityEvent() {
        this.timestamp = LocalDateTime.now();
    }

    public SecurityEvent(String eventType, Long userId, String ipAddress, String severity, String details) {
        this.eventType = eventType;
        this.userId = userId;
        this.ipAddress = ipAddress;
        this.severity = severity;
        this.details = details;
        this.timestamp = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
}
