package com.buslink.dto;

public class BoardingRequest {
    private Long tripId;
    private Long busId;
    private String location;

    public BoardingRequest() {
    }

    public BoardingRequest(Long tripId, Long busId, String location) {
        this.tripId = tripId;
        this.busId = busId;
        this.location = location;
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
