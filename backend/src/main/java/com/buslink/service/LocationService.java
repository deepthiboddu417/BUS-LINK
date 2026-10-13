package com.buslink.service;

import com.buslink.dto.LocationUpdateRequest;
import com.buslink.entity.Bus;
import com.buslink.entity.BusLocationHistory;
import com.buslink.entity.Trip;
import com.buslink.entity.TripStatus;
import com.buslink.exception.ResourceNotFoundException;
import com.buslink.exception.UnauthorizedAccessException;
import com.buslink.repository.BusLocationHistoryRepository;
import com.buslink.repository.BusRepository;
import com.buslink.repository.TripRepository;
import com.buslink.security.SecurityUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
public class LocationService {

    @Autowired
    private BusRepository busRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private BusLocationHistoryRepository locationHistoryRepository;

    @Autowired
    private GpsIntegrityService gpsIntegrityService;

    @Autowired
    private GeofenceService geofenceService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    @Transactional
    public Bus updateBusLocation(Long busId, LocationUpdateRequest request) {
        Bus bus = busRepository.findById(busId)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + busId));

        validateDriverBusOwnership(bus);

        Long driverId = bus.getDriver() != null ? bus.getDriver().getId() : null;

        // 1. Validate GPS bounds and movement integrity
        boolean isValidMovement = gpsIntegrityService.evaluateLocationIntegrity(bus, request.getLatitude(), request.getLongitude(), driverId);

        // Update bus coordinates
        bus.setCurrentLat(request.getLatitude());
        bus.setCurrentLng(request.getLongitude());
        bus.setLastLocationUpdate(LocalDateTime.now());

        // 2. If trip is STARTED, transition to IN_TRANSIT
        Trip activeTrip = tripRepository.findTopByBusIdAndStatusInOrderByStartTimeDesc(
                busId, Arrays.asList(TripStatus.STARTED, TripStatus.IN_TRANSIT)
        ).orElse(null);

        if (activeTrip != null && activeTrip.getStatus() == TripStatus.STARTED) {
            activeTrip.setStatus(TripStatus.IN_TRANSIT);
            tripRepository.save(activeTrip);
            bus.setStatus(TripStatus.IN_TRANSIT);
        }

        bus = busRepository.save(bus);

        // 3. Record location history
        BusLocationHistory history = new BusLocationHistory(bus, activeTrip, request.getLatitude(), request.getLongitude());
        locationHistoryRepository.save(history);

        // 4. Trigger Geofence Checks
        geofenceService.checkGeofences(bus, request.getLatitude(), request.getLongitude());

        // 5. Audit log
        if (!isValidMovement) {
            auditLogService.logUserAction(SecurityUtil.getCurrentUserPrincipal(), "LOCATION_SUSPICIOUS", "Bus", busId.toString(), null, "DENIED", "Suspicious GPS movement detected and logged");
        }

        // 6. Real-time WebSocket notification
        if (messagingTemplate != null) {
            try {
                messagingTemplate.convertAndSend("/topic/bus/" + busId + "/location", bus);
            } catch (Exception ignored) {}
        }

        return bus;
    }

    public void validateDriverBusOwnership(Bus bus) {
        if (SecurityUtil.isAdmin()) return;

        String currentEmail = SecurityUtil.getCurrentUserEmail();
        if (bus.getDriver() == null || bus.getDriver().getUser() == null ||
                !bus.getDriver().getUser().getEmail().equalsIgnoreCase(currentEmail)) {
            throw new UnauthorizedAccessException("Access Denied: Driver can only update location for their assigned bus");
        }
    }

    public Bus getBusLocation(Long busId) {
        return busRepository.findById(busId)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + busId));
    }

    public List<BusLocationHistory> getLocationHistory(Long busId) {
        return locationHistoryRepository.findByBusIdOrderByTimestampDesc(busId);
    }
}
