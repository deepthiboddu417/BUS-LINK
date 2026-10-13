package com.buslink.service;

import com.buslink.entity.Bus;
import com.buslink.entity.SuspiciousLocationEvent;
import com.buslink.exception.InvalidGpsException;
import com.buslink.repository.SuspiciousLocationEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class GpsIntegrityService {

    private static final double MAX_REALISTIC_SPEED_KMH = 120.0;
    private static final double EARTH_RADIUS_KM = 6371.0;

    @Autowired
    private SuspiciousLocationEventRepository suspiciousLocationEventRepository;

    public void validateGpsCoordinates(Double lat, Double lng) {
        if (lat == null || lng == null) {
            throw new InvalidGpsException("Latitude and Longitude coordinates cannot be null");
        }
        if (lat < -90.0 || lat > 90.0) {
            throw new InvalidGpsException("Invalid Latitude coordinate: " + lat + ". Must be between -90 and 90.");
        }
        if (lng < -180.0 || lng > 180.0) {
            throw new InvalidGpsException("Invalid Longitude coordinate: " + lng + ". Must be between -180 and 180.");
        }
    }

    public boolean evaluateLocationIntegrity(Bus bus, Double newLat, Double newLng, Long driverId) {
        validateGpsCoordinates(newLat, newLng);

        Double prevLat = bus.getCurrentLat();
        Double prevLng = bus.getCurrentLng();
        LocalDateTime lastUpdate = bus.getLastLocationUpdate();

        if (prevLat == null || prevLng == null || lastUpdate == null) {
            return true; // Initial location set
        }

        double distanceKm = calculateHaversineDistance(prevLat, prevLng, newLat, newLng);
        long elapsedSeconds = Math.max(1, Duration.between(lastUpdate, LocalDateTime.now()).getSeconds());
        double hours = elapsedSeconds / 3600.0;
        double speedKmh = distanceKm / hours;

        // If movement is physically impossible (teleportation / speed > 120km/h for bus)
        if (speedKmh > MAX_REALISTIC_SPEED_KMH && distanceKm > 1.0) {
            SuspiciousLocationEvent event = new SuspiciousLocationEvent(
                    bus.getId(),
                    driverId,
                    prevLat,
                    prevLng,
                    newLat,
                    newLng,
                    Math.round(speedKmh * 100.0) / 100.0,
                    Math.round(distanceKm * 100.0) / 100.0,
                    "Physically unrealistic movement detected: " + Math.round(speedKmh) + " km/h over " + Math.round(distanceKm * 10.0)/10.0 + " km in " + elapsedSeconds + "s"
            );
            suspiciousLocationEventRepository.save(event);
            return false; // Flagged as suspicious
        }

        return true;
    }

    public double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }
}
