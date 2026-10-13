package com.buslink.service;

import com.buslink.dto.LocationUpdateRequest;
import com.buslink.entity.*;
import com.buslink.exception.BadRequestException;
import com.buslink.exception.ResourceNotFoundException;
import com.buslink.exception.UnauthorizedAccessException;
import com.buslink.repository.*;
import com.buslink.security.SecurityUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TrackingService {

    @Autowired
    private BusRepository busRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private ParentRepository parentRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private BusLocationHistoryRepository locationHistoryRepository;

    @Autowired
    private GpsIntegrityService gpsIntegrityService;

    @Autowired
    private GeofenceService geofenceService;

    @Autowired
    private GpsSimulationService gpsSimulationService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    @Transactional
    public Bus submitDriverLocation(LocationUpdateRequest request) {
        if (request == null) {
            throw new BadRequestException("Location request payload cannot be empty.");
        }

        String currentEmail = SecurityUtil.getCurrentUserEmail();
        Bus bus;

        // Secure driver identification directly from SecurityContext
        if (SecurityUtil.hasRole("DRIVER") && !SecurityUtil.isAdmin()) {
            Driver driver = driverRepository.findByUserEmail(currentEmail)
                    .orElseThrow(() -> new UnauthorizedAccessException("Driver profile not found."));
            bus = busRepository.findByDriverId(driver.getId())
                    .orElseThrow(() -> new UnauthorizedAccessException("You are not assigned to any active bus."));

            if (request.getBusId() != null && !request.getBusId().equals(bus.getId())) {
                throw new UnauthorizedAccessException("Access Denied: You can only broadcast GPS coordinates for your assigned bus (" + bus.getBusNumber() + ").");
            }
        } else if (SecurityUtil.isAdmin()) {
            Long busId = request.getBusId() != null ? request.getBusId() : 1L;
            bus = busRepository.findById(busId)
                    .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + busId));
        } else {
            throw new UnauthorizedAccessException("Access Denied: Only authenticated drivers and administrators can broadcast location updates.");
        }

        // Validate coordinates
        gpsIntegrityService.validateGpsCoordinates(request.getLatitude(), request.getLongitude());

        // Stop active simulation if real driver GPS arrives
        if (gpsSimulationService.isSimulating(bus.getId())) {
            gpsSimulationService.stopSimulation(bus.getId());
        }

        Long driverId = bus.getDriver() != null ? bus.getDriver().getId() : null;
        boolean isValidMovement = gpsIntegrityService.evaluateLocationIntegrity(
                bus, request.getLatitude(), request.getLongitude(), driverId
        );

        // Update bus telemetry state
        bus.setCurrentLat(request.getLatitude());
        bus.setCurrentLng(request.getLongitude());
        bus.setLastLocationUpdate(LocalDateTime.now());
        bus.setTrackingSource("REAL_GPS");
        if (request.getAccuracy() != null) bus.setCurrentAccuracy(request.getAccuracy());
        if (request.getSpeed() != null) bus.setCurrentSpeed(request.getSpeed());
        if (request.getHeading() != null) bus.setCurrentHeading(request.getHeading());

        // Validate active trip status: Driver must have an active trip (STARTED or IN_TRANSIT)
        Trip activeTrip = tripRepository.findTopByBusIdAndStatusInOrderByStartTimeDesc(
                bus.getId(), Arrays.asList(TripStatus.STARTED, TripStatus.IN_TRANSIT)
        ).orElse(null);

        if (activeTrip == null) {
            if (SecurityUtil.isAdmin()) {
                // Admin override/test mode: create active trip for bus telemetry
                activeTrip = new Trip(bus, bus.getDriver(), bus.getRoute(), TripStatus.IN_TRANSIT, java.time.LocalDate.now());
                activeTrip.setStartTime(LocalDateTime.now());
                activeTrip = tripRepository.save(activeTrip);
                bus.setStatus(TripStatus.IN_TRANSIT);
            } else {
                throw new BadRequestException("Cannot submit GPS coordinates: Bus " + bus.getBusNumber() + " has no active trip in progress. Driver must start an authorized trip before transmitting live GPS telemetry.");
            }
        }

        if (request.getTripId() != null && !activeTrip.getId().equals(request.getTripId())) {
            throw new BadRequestException("Trip ID mismatch: Active trip is #" + activeTrip.getId() + " but request specified trip #" + request.getTripId());
        }

        if (activeTrip.getStatus() == TripStatus.STARTED) {
            activeTrip.setStatus(TripStatus.IN_TRANSIT);
            tripRepository.save(activeTrip);
            bus.setStatus(TripStatus.IN_TRANSIT);
        }

        bus = busRepository.save(bus);

        // Record bounded location history
        BusLocationHistory history = new BusLocationHistory(
                bus, activeTrip, request.getLatitude(), request.getLongitude(),
                "REAL_GPS", request.getAccuracy(), request.getSpeed(), request.getHeading()
        );
        locationHistoryRepository.save(history);

        // Evaluate Geofences
        try {
            geofenceService.checkGeofences(bus, request.getLatitude(), request.getLongitude());
        } catch (Exception ignored) {}

        // Log suspicious jumps if detected
        if (!isValidMovement) {
            auditLogService.logUserAction(
                    SecurityUtil.getCurrentUserPrincipal(),
                    "LOCATION_SUSPICIOUS",
                    "Bus",
                    bus.getId().toString(),
                    null,
                    "DENIED",
                    "Suspicious GPS movement detected and flagged."
            );
        }

        // Real-time WebSocket broadcasting
        if (messagingTemplate != null) {
            try {
                messagingTemplate.convertAndSend("/topic/bus/" + bus.getId() + "/location", bus);
            } catch (Exception ignored) {}
        }

        return bus;
    }

    public Bus getLatestBusLocation(Long busId) {
        validateBusAccess(busId);
        return busRepository.findById(busId)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + busId));
    }

    public List<BusLocationHistory> getLocationHistory(Long busId, int limit) {
        validateBusAccess(busId);
        List<BusLocationHistory> all = locationHistoryRepository.findByBusIdOrderByTimestampDesc(busId);
        int max = limit > 0 ? Math.min(limit, all.size()) : Math.min(50, all.size());
        return all.subList(0, max);
    }

    public Route getBusRoute(Long busId) {
        validateBusAccess(busId);
        Bus bus = busRepository.findById(busId)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + busId));
        if (bus.getRoute() == null) {
            throw new ResourceNotFoundException("No route configured for bus " + bus.getBusNumber());
        }
        return bus.getRoute();
    }

    public List<Bus> getActiveBuses() {
        if (SecurityUtil.isAdmin()) {
            return busRepository.findAll();
        }

        String currentEmail = SecurityUtil.getCurrentUserEmail();

        if (SecurityUtil.hasRole("DRIVER")) {
            return busRepository.findByDriverUserEmail(currentEmail)
                    .map(Collections::singletonList)
                    .orElse(Collections.emptyList());
        }

        if (SecurityUtil.hasRole("PARENT")) {
            Parent parent = parentRepository.findByUserEmail(currentEmail).orElse(null);
            if (parent == null) return Collections.emptyList();
            List<Student> children = studentRepository.findByParentId(parent.getId());
            return children.stream()
                    .map(Student::getBus)
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList());
        }

        if (SecurityUtil.hasRole("STUDENT")) {
            return studentRepository.findByUserEmail(currentEmail)
                    .map(st -> st.getBus() != null ? Collections.singletonList(st.getBus()) : Collections.<Bus>emptyList())
                    .orElse(Collections.emptyList());
        }

        return Collections.emptyList();
    }

    public Map<String, Object> startSimulation(Long busId) {
        validateSimulationControl(busId);
        return gpsSimulationService.startSimulation(busId);
    }

    public Map<String, Object> stopSimulation(Long busId) {
        validateSimulationControl(busId);
        return gpsSimulationService.stopSimulation(busId);
    }

    public Map<String, Object> getSimulationStatus(Long busId) {
        validateBusAccess(busId);
        return gpsSimulationService.getSimulationStatus(busId);
    }

    private void validateSimulationControl(Long busId) {
        if (SecurityUtil.isAdmin()) return;

        if (SecurityUtil.hasRole("DRIVER")) {
            String currentEmail = SecurityUtil.getCurrentUserEmail();
            Bus bus = busRepository.findByDriverUserEmail(currentEmail)
                    .orElseThrow(() -> new UnauthorizedAccessException("Driver is not assigned to any active bus."));
            if (!bus.getId().equals(busId)) {
                throw new UnauthorizedAccessException("Access Denied: Drivers can only control simulation for their assigned bus.");
            }
            return;
        }

        throw new UnauthorizedAccessException("Access Denied: Only administrators and authorized bus drivers can control simulation mode.");
    }

    public void validateBusAccess(Long busId) {
        if (SecurityUtil.isAdmin()) return;

        String currentEmail = SecurityUtil.getCurrentUserEmail();

        if (SecurityUtil.hasRole("DRIVER")) {
            Bus bus = busRepository.findByDriverUserEmail(currentEmail).orElse(null);
            if (bus == null || !bus.getId().equals(busId)) {
                throw new UnauthorizedAccessException("Access Denied: You are not authorized to track this bus.");
            }
            return;
        }

        if (SecurityUtil.hasRole("PARENT")) {
            Parent parent = parentRepository.findByUserEmail(currentEmail)
                    .orElseThrow(() -> new UnauthorizedAccessException("Parent profile not found."));
            List<Student> children = studentRepository.findByParentId(parent.getId());
            boolean isLinked = children.stream().anyMatch(ch -> ch.getBus() != null && ch.getBus().getId().equals(busId));
            if (!isLinked) {
                throw new UnauthorizedAccessException("Access Denied: Parents can only track buses assigned to their linked children.");
            }
            return;
        }

        if (SecurityUtil.hasRole("STUDENT")) {
            Student student = studentRepository.findByUserEmail(currentEmail)
                    .orElseThrow(() -> new UnauthorizedAccessException("Student profile not found."));
            if (student.getBus() == null || !student.getBus().getId().equals(busId)) {
                throw new UnauthorizedAccessException("Access Denied: Students can only track their assigned bus.");
            }
            return;
        }

        throw new UnauthorizedAccessException("Access Denied: Unauthorized access to bus location.");
    }
}
