package com.buslink.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bus_locations")
public class BusLocationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bus_id", nullable = false)
    private Bus bus;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id")
    private Trip trip;

    private Double latitude;
    private Double longitude;
    @com.fasterxml.jackson.annotation.JsonFormat(shape = com.fasterxml.jackson.annotation.JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS")
    private LocalDateTime timestamp;
    private String source = "REAL_GPS"; // "REAL_GPS" or "SIMULATED"
    private Double accuracy;
    private Double speed;
    private Double heading;

    public BusLocationHistory() {
    }

    public BusLocationHistory(Bus bus, Trip trip, Double latitude, Double longitude) {
        this(bus, trip, latitude, longitude, "REAL_GPS", null, null, null);
    }

    public BusLocationHistory(Bus bus, Trip trip, Double latitude, Double longitude, String source, Double accuracy, Double speed, Double heading) {
        this.bus = bus;
        this.trip = trip;
        this.latitude = latitude;
        this.longitude = longitude;
        this.source = source != null ? source : "REAL_GPS";
        this.accuracy = accuracy;
        this.speed = speed;
        this.heading = heading;
        this.timestamp = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @Transient
    public Long getBusId() {
        return bus != null ? bus.getId() : null;
    }

    @Transient
    public Long getTripId() {
        return trip != null ? trip.getId() : null;
    }

    public Bus getBus() {
        return bus;
    }

    public void setBus(Bus bus) {
        this.bus = bus;
    }

    public Trip getTrip() {
        return trip;
    }

    public void setTrip(Trip trip) {
        this.trip = trip;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    @Transient
    public Long getTimestampEpoch() {
        return timestamp != null ? timestamp.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli() : null;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getSource() {
        return source != null ? source : "REAL_GPS";
    }

    public void setSource(String source) {
        this.source = source;
    }

    public Double getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(Double accuracy) {
        this.accuracy = accuracy;
    }

    public Double getSpeed() {
        return speed;
    }

    public void setSpeed(Double speed) {
        this.speed = speed;
    }

    public Double getHeading() {
        return heading;
    }

    public void setHeading(Double heading) {
        this.heading = heading;
    }
}
