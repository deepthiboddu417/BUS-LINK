package com.buslink.dto;

public class EmergencyRequest {
    private String message;
    private Double latitude;
    private Double longitude;
    private Long busId;

    public EmergencyRequest() {
    }

    public EmergencyRequest(String message, Double latitude, Double longitude, Long busId) {
        this.message = message;
        this.latitude = latitude;
        this.longitude = longitude;
        this.busId = busId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
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

    public Long getBusId() {
        return busId;
    }

    public void setBusId(Long busId) {
        this.busId = busId;
    }
}
