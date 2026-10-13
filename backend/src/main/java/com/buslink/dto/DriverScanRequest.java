package com.buslink.dto;

public class DriverScanRequest {
    private String qrToken;
    private Long tripId;
    private Long busId;
    private String location;

    public DriverScanRequest() {}

    public DriverScanRequest(String qrToken, Long tripId, Long busId, String location) {
        this.qrToken = qrToken;
        this.tripId = tripId;
        this.busId = busId;
        this.location = location;
    }

    public String getQrToken() {
        return qrToken;
    }

    public void setQrToken(String qrToken) {
        this.qrToken = qrToken;
    }

    public Long getTripId() {
        return tripId;
    }

    public void setTripId(Long tripId) {
        this.tripId = tripId;
    }

    public Long getBusId() {
        return busId;
    }

    public void setBusId(Long busId) {
        this.busId = busId;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }
}
