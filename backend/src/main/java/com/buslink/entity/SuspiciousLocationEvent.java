package com.buslink.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "suspicious_location_events")
public class SuspiciousLocationEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long busId;

    private Long driverId;

    private Double prevLat;

    private Double prevLng;

    private Double newLat;

    private Double newLng;

    private Double calculatedSpeedKmh;

    private Double distanceKm;

    private String reason;

    private LocalDateTime timestamp;

    private String status; // FLAGGED, REVIEWED, DISMISSED

    public SuspiciousLocationEvent() {
        this.timestamp = LocalDateTime.now();
        this.status = "FLAGGED";
    }

    public SuspiciousLocationEvent(Long busId, Long driverId, Double prevLat, Double prevLng, Double newLat, Double newLng, Double calculatedSpeedKmh, Double distanceKm, String reason) {
        this.busId = busId;
        this.driverId = driverId;
        this.prevLat = prevLat;
        this.prevLng = prevLng;
        this.newLat = newLat;
        this.newLng = newLng;
        this.calculatedSpeedKmh = calculatedSpeedKmh;
        this.distanceKm = distanceKm;
        this.reason = reason;
        this.timestamp = LocalDateTime.now();
        this.status = "FLAGGED";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getBusId() { return busId; }
    public void setBusId(Long busId) { this.busId = busId; }

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public Double getPrevLat() { return prevLat; }
    public void setPrevLat(Double prevLat) { this.prevLat = prevLat; }

    public Double getPrevLng() { return prevLng; }
    public void setPrevLng(Double prevLng) { this.prevLng = prevLng; }

    public Double getNewLat() { return newLat; }
    public void setNewLat(Double newLat) { this.newLat = newLat; }

    public Double getNewLng() { return newLng; }
    public void setNewLng(Double newLng) { this.newLng = newLng; }

    public Double getCalculatedSpeedKmh() { return calculatedSpeedKmh; }
    public void setCalculatedSpeedKmh(Double calculatedSpeedKmh) { this.calculatedSpeedKmh = calculatedSpeedKmh; }

    public Double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(Double distanceKm) { this.distanceKm = distanceKm; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
