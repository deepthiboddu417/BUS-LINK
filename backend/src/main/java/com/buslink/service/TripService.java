package com.buslink.service;

import com.buslink.entity.*;
import com.buslink.exception.BadRequestException;
import com.buslink.exception.InvalidTripTransitionException;
import com.buslink.exception.ResourceNotFoundException;
import com.buslink.exception.UnauthorizedAccessException;
import com.buslink.repository.BusRepository;
import com.buslink.repository.StudentRepository;
import com.buslink.repository.TripRepository;
import com.buslink.security.SecurityUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class TripService {

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private BusRepository busRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired(required = false)
    private GpsSimulationService gpsSimulationService;

    @Transactional
    public Trip startTrip(Long busId) {
        Bus bus = busRepository.findById(busId)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + busId));

        validateDriverBusOwnership(bus);

        // Stop simulation if running for this bus
        if (gpsSimulationService != null && gpsSimulationService.isSimulating(busId)) {
            gpsSimulationService.stopSimulation(busId);
        }

        // Validate trip status transition
        if (bus.getStatus() == TripStatus.STARTED || bus.getStatus() == TripStatus.IN_TRANSIT) {
            throw new InvalidTripTransitionException("Trip is already active for Bus " + bus.getBusNumber());
        }
        if (bus.getStatus() == TripStatus.COMPLETED) {
            // Reset for new daily trip
            bus.setStatus(TripStatus.NOT_STARTED);
        }

        Trip trip = new Trip(bus, bus.getDriver(), bus.getRoute(), TripStatus.STARTED, LocalDate.now());
        trip.setStartTime(LocalDateTime.now());
        trip = tripRepository.save(trip);

        bus.setStatus(TripStatus.STARTED);
        bus.setTrackingSource("REAL_GPS");
        busRepository.save(bus);

        auditLogService.logUserAction(SecurityUtil.getCurrentUserPrincipal(), "TRIP_STARTED", "Trip", trip.getId().toString(), null, "SUCCESS", "Trip started for bus " + bus.getBusNumber());

        // Notify parents of students on this bus
        List<Student> students = studentRepository.findByBusId(busId);
        for (Student s : students) {
            if (s.getParent() != null) {
                String message = "BUS-LINK Notice: Bus " + bus.getBusNumber() + " has started its journey for route " + (bus.getRoute() != null ? bus.getRoute().getRouteName() : "College Route") + ".";
                notificationService.createNotification(s.getParent(), s, message, NotificationType.BUS_STARTED);
            }
        }

        return trip;
    }

    @Transactional
    public Trip endTrip(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + tripId));

        Bus bus = trip.getBus();
        validateDriverBusOwnership(bus);

        // Enforce transition rules
        if (trip.getStatus() == TripStatus.COMPLETED) {
            throw new InvalidTripTransitionException("Cannot transition trip: Trip is already COMPLETED.");
        }
        if (trip.getStatus() == TripStatus.NOT_STARTED) {
            throw new InvalidTripTransitionException("Cannot transition trip directly from NOT_STARTED to COMPLETED. Start the trip first.");
        }

        if (gpsSimulationService != null && gpsSimulationService.isSimulating(bus.getId())) {
            gpsSimulationService.stopSimulation(bus.getId());
        }

        trip.setStatus(TripStatus.COMPLETED);
        trip.setEndTime(LocalDateTime.now());
        trip = tripRepository.save(trip);

        bus.setStatus(TripStatus.COMPLETED);
        bus.setCurrentSpeed(0.0);
        busRepository.save(bus);

        auditLogService.logUserAction(SecurityUtil.getCurrentUserPrincipal(), "TRIP_COMPLETED", "Trip", trip.getId().toString(), null, "SUCCESS", "Trip completed for bus " + bus.getBusNumber());

        // Notify parents
        List<Student> students = studentRepository.findByBusId(bus.getId());
        for (Student s : students) {
            if (s.getParent() != null) {
                String message = "BUS-LINK Alert: Bus " + bus.getBusNumber() + " trip has COMPLETED. All students arrived safely.";
                notificationService.createNotification(s.getParent(), s, message, NotificationType.TRIP_COMPLETED);
            }
        }

        return trip;
    }

    public void validateDriverBusOwnership(Bus bus) {
        if (SecurityUtil.isAdmin()) {
            return;
        }
        String currentEmail = SecurityUtil.getCurrentUserEmail();
        if (bus.getDriver() == null || bus.getDriver().getUser() == null ||
                !bus.getDriver().getUser().getEmail().equalsIgnoreCase(currentEmail)) {
            throw new UnauthorizedAccessException("Access Denied: Driver can only manage their assigned bus (#" + bus.getId() + ")");
        }
    }

    public List<Trip> getAllTrips() {
        return tripRepository.findAll();
    }

    public List<Trip> getActiveTrips() {
        return tripRepository.findByStatus(TripStatus.IN_TRANSIT);
    }

    public Trip getActiveTripForBus(Long busId) {
        return tripRepository.findTopByBusIdOrderByStartTimeDesc(busId).orElse(null);
    }
}
