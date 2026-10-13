package com.buslink.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "buses")
public class Bus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String busNumber;

    private Integer capacity;

    private Double currentLat;
    private Double currentLng;
    @com.fasterxml.jackson.annotation.JsonFormat(shape = com.fasterxml.jackson.annotation.JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS")
    private LocalDateTime lastLocationUpdate;
    private String trackingSource; // "REAL_GPS" or "SIMULATED"
    private Double currentAccuracy;
    private Double currentSpeed;
    private Double currentHeading;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "driver_id")
    private Driver driver;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "route_id")
    private Route route;

    @Enumerated(EnumType.STRING)
    private TripStatus status = TripStatus.NOT_STARTED;

    public Bus() {
    }

    public Bus(String busNumber, Integer capacity, Route route, Driver driver) {
        this.busNumber = busNumber;
        this.capacity = capacity;
        this.route = route;
        this.driver = driver;
        this.status = TripStatus.NOT_STARTED;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getBusNumber() {
        return busNumber;
    }

    public void setBusNumber(String busNumber) {
        this.busNumber = busNumber;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public Double getCurrentLat() {
        return currentLat;
    }

    public void setCurrentLat(Double currentLat) {
        this.currentLat = currentLat;
    }

    public Double getCurrentLng() {
        return currentLng;
    }

    public void setCurrentLng(Double currentLng) {
        this.currentLng = currentLng;
    }

    public LocalDateTime getLastLocationUpdate() {
        return lastLocationUpdate;
    }

    @Transient
    public Long getLastLocationUpdateEpoch() {
        return lastLocationUpdate != null ? lastLocationUpdate.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli() : null;
    }

    public void setLastLocationUpdate(LocalDateTime lastLocationUpdate) {
        this.lastLocationUpdate = lastLocationUpdate;
    }

    public Driver getDriver() {
        return driver;
    }

    public void setDriver(Driver driver) {
        this.driver = driver;
    }

    public Route getRoute() {
        return route;
    }

    public void setRoute(Route route) {
        this.route = route;
    }

    public TripStatus getStatus() {
        return status;
    }

    public void setStatus(TripStatus status) {
        this.status = status;
    }

    public String getTrackingSource() {
        return trackingSource != null ? trackingSource : "REAL_GPS";
    }

    public void setTrackingSource(String trackingSource) {
        this.trackingSource = trackingSource;
    }

    public Double getCurrentAccuracy() {
        return currentAccuracy;
    }

    public void setCurrentAccuracy(Double currentAccuracy) {
        this.currentAccuracy = currentAccuracy;
    }

    public Double getCurrentSpeed() {
        return currentSpeed;
    }

    public void setCurrentSpeed(Double currentSpeed) {
        this.currentSpeed = currentSpeed;
    }

    public Double getCurrentHeading() {
        return currentHeading;
    }

    public void setCurrentHeading(Double currentHeading) {
        this.currentHeading = currentHeading;
    }
}
