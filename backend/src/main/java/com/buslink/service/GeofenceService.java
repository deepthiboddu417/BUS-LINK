package com.buslink.service;

import com.buslink.entity.Bus;
import com.buslink.entity.Geofence;
import com.buslink.entity.NotificationType;
import com.buslink.repository.GeofenceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GeofenceService {

    @Autowired
    private GeofenceRepository geofenceRepository;

    @Autowired
    private GpsIntegrityService gpsIntegrityService;

    @Autowired
    private NotificationService notificationService;

    public void checkGeofences(Bus bus, Double lat, Double lng) {
        List<Geofence> activeGeofences = geofenceRepository.findByActiveTrue();
        if (activeGeofences.isEmpty()) return;

        for (Geofence gf : activeGeofences) {
            double distanceKm = gpsIntegrityService.calculateHaversineDistance(lat, lng, gf.getLatitude(), gf.getLongitude());
            double distanceMeters = distanceKm * 1000.0;

            if (distanceMeters <= gf.getRadiusMeters()) {
                // Bus is inside the geofence
                if (gf.getType().equalsIgnoreCase("COLLEGE")) {
                    notificationService.createSystemNotification(
                            NotificationType.BUS_ARRIVED_COLLEGE,
                            "🚌 Bus " + bus.getBusNumber() + " has arrived at " + gf.getName()
                    );
                } else if (gf.getType().equalsIgnoreCase("BUS_STOP")) {
                    notificationService.createSystemNotification(
                            NotificationType.BUS_ARRIVED_STOP,
                            "🚏 Bus " + bus.getBusNumber() + " reached stop: " + gf.getName()
                    );
                }
            } else if (distanceMeters <= gf.getRadiusMeters() + 500) {
                // Bus is approaching geofence
                notificationService.createSystemNotification(
                        NotificationType.BUS_APPROACHING,
                        "🔔 Bus " + bus.getBusNumber() + " is approaching " + gf.getName()
                );
            }
        }
    }
}
