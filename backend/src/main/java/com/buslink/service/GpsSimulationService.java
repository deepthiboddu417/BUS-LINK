package com.buslink.service;

import com.buslink.entity.*;
import com.buslink.exception.BadRequestException;
import com.buslink.exception.ResourceNotFoundException;
import com.buslink.repository.BusLocationHistoryRepository;
import com.buslink.repository.BusRepository;
import com.buslink.repository.TripRepository;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;

@Service
public class GpsSimulationService {

    private static final Logger log = LoggerFactory.getLogger(GpsSimulationService.class);

    @Autowired
    private BusRepository busRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private BusLocationHistoryRepository locationHistoryRepository;

    @Autowired
    private GeofenceService geofenceService;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(4);
    private final ConcurrentHashMap<Long, SimulationTask> activeSimulations = new ConcurrentHashMap<>();

    private static class Coordinate {
        final double lat;
        final double lng;
        final String name;

        Coordinate(double lat, double lng, String name) {
            this.lat = lat;
            this.lng = lng;
            this.name = name;
        }
    }

    private static class SimulationTask {
        final ScheduledFuture<?> future;
        final List<Coordinate> path;
        final long startTime;
        volatile int currentIndex;

        SimulationTask(ScheduledFuture<?> future, List<Coordinate> path) {
            this.future = future;
            this.path = path;
            this.startTime = System.currentTimeMillis();
            this.currentIndex = 0;
        }
    }

    public synchronized Map<String, Object> startSimulation(Long busId) {
        Bus bus = busRepository.findById(busId)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + busId));

        // Stop any running simulation for this bus to prevent multiple simultaneous loops
        stopSimulation(busId);

        List<Coordinate> path = generateRoutePath(bus);
        if (path.isEmpty()) {
            throw new BadRequestException("Cannot simulate: Bus does not have a configured route with stops.");
        }

        // Do not mix simulated and real points within the same active trip:
        // If an active trip had REAL_GPS points, complete it cleanly before beginning simulation
        Trip activeTrip = tripRepository.findTopByBusIdAndStatusInOrderByStartTimeDesc(
                busId, Arrays.asList(TripStatus.STARTED, TripStatus.IN_TRANSIT)
        ).orElse(null);

        if (activeTrip != null && "REAL_GPS".equalsIgnoreCase(bus.getTrackingSource())) {
            activeTrip.setStatus(TripStatus.COMPLETED);
            activeTrip.setEndTime(LocalDateTime.now());
            tripRepository.save(activeTrip);
            activeTrip = null;
        }

        // Ensure a dedicated simulation trip exists
        if (activeTrip == null) {
            Trip simTrip = new Trip(bus, bus.getDriver(), bus.getRoute(), TripStatus.IN_TRANSIT, java.time.LocalDate.now());
            simTrip.setStartTime(LocalDateTime.now());
            tripRepository.save(simTrip);
        }

        // Set bus status
        bus.setStatus(TripStatus.IN_TRANSIT);
        bus.setTrackingSource("SIMULATED");
        bus.setCurrentLat(path.get(0).lat);
        bus.setCurrentLng(path.get(0).lng);
        bus.setLastLocationUpdate(LocalDateTime.now());
        bus.setCurrentSpeed(35.0);
        bus.setCurrentAccuracy(10.0);
        busRepository.save(bus);

        // Schedule periodic step execution every 2.5 seconds
        SimulationTaskHolder holder = new SimulationTaskHolder();
        ScheduledFuture<?> future = scheduler.scheduleAtFixedRate(() -> {
            try {
                executeSimulationStep(busId, holder.task);
            } catch (Exception ex) {
                log.error("Error executing simulation step for bus {}: {}", busId, ex.getMessage());
            }
        }, 1, 2500, TimeUnit.MILLISECONDS);

        SimulationTask task = new SimulationTask(future, path);
        holder.task = task;
        activeSimulations.put(busId, task);

        log.info("Started demo GPS simulation for Bus {} with {} waypoints.", bus.getBusNumber(), path.size());

        Map<String, Object> result = new HashMap<>();
        result.put("busId", busId);
        result.put("busNumber", bus.getBusNumber());
        result.put("active", true);
        result.put("source", "SIMULATED");
        result.put("totalWaypoints", path.size());
        result.put("message", "Simulated demo tracking started successfully along configured route.");
        return result;
    }

    private static class SimulationTaskHolder {
        SimulationTask task;
    }

    private void executeSimulationStep(Long busId, SimulationTask task) {
        if (task == null || task.future.isCancelled()) return;

        Bus bus = busRepository.findById(busId).orElse(null);
        if (bus == null) {
            stopSimulation(busId);
            return;
        }

        if ("REAL_GPS".equalsIgnoreCase(bus.getTrackingSource())) {
            log.info("Terminating simulation for bus {} as REAL_GPS telemetry has taken over.", busId);
            stopSimulation(busId);
            return;
        }

        int idx = task.currentIndex;
        Coordinate currentCoord = task.path.get(idx);

        // Calculate heading to next point
        double heading = 0.0;
        if (idx < task.path.size() - 1) {
            Coordinate nextCoord = task.path.get(idx + 1);
            heading = calculateBearing(currentCoord.lat, currentCoord.lng, nextCoord.lat, nextCoord.lng);
        }

        // Update Bus state
        bus.setCurrentLat(currentCoord.lat);
        bus.setCurrentLng(currentCoord.lng);
        bus.setLastLocationUpdate(LocalDateTime.now());
        bus.setTrackingSource("SIMULATED");
        bus.setCurrentSpeed(38.0 + (Math.sin(idx) * 5.0)); // realistic minor fluctuation
        bus.setCurrentAccuracy(8.0);
        bus.setCurrentHeading(heading);
        bus.setStatus(TripStatus.IN_TRANSIT);
        bus = busRepository.save(bus);

        // Record location history marked as SIMULATED
        Trip activeTrip = tripRepository.findTopByBusIdAndStatusInOrderByStartTimeDesc(
                busId, Arrays.asList(TripStatus.STARTED, TripStatus.IN_TRANSIT)
        ).orElse(null);

        BusLocationHistory history = new BusLocationHistory(
                bus, activeTrip, currentCoord.lat, currentCoord.lng, "SIMULATED", 8.0, bus.getCurrentSpeed(), heading
        );
        locationHistoryRepository.save(history);

        // Trigger Geofence Checks
        try {
            geofenceService.checkGeofences(bus, currentCoord.lat, currentCoord.lng);
        } catch (Exception ignored) {}

        // Broadcast to WebSocket subscribers
        if (messagingTemplate != null) {
            try {
                messagingTemplate.convertAndSend("/topic/bus/" + busId + "/location", bus);
            } catch (Exception ignored) {}
        }

        // Advance to next point or loop smoothly
        task.currentIndex = (idx + 1) % task.path.size();
    }

    public synchronized Map<String, Object> stopSimulation(Long busId) {
        SimulationTask task = activeSimulations.remove(busId);
        boolean wasRunning = false;
        if (task != null) {
            task.future.cancel(true);
            wasRunning = true;
            log.info("Stopped demo GPS simulation for Bus ID {}", busId);
        }

        busRepository.findById(busId).ifPresent(bus -> {
            if ("SIMULATED".equalsIgnoreCase(bus.getTrackingSource())) {
                bus.setCurrentSpeed(0.0);
                bus.setStatus(TripStatus.COMPLETED);
                busRepository.save(bus);

                tripRepository.findTopByBusIdAndStatusInOrderByStartTimeDesc(
                        busId, Arrays.asList(TripStatus.STARTED, TripStatus.IN_TRANSIT)
                ).ifPresent(trip -> {
                    trip.setStatus(TripStatus.COMPLETED);
                    trip.setEndTime(LocalDateTime.now());
                    tripRepository.save(trip);
                });
            }
        });

        Map<String, Object> result = new HashMap<>();
        result.put("busId", busId);
        result.put("active", false);
        result.put("wasRunning", wasRunning);
        result.put("message", wasRunning ? "Simulation stopped cleanly." : "Simulation was not active for this bus.");
        return result;
    }

    public boolean isSimulating(Long busId) {
        SimulationTask task = activeSimulations.get(busId);
        return task != null && !task.future.isCancelled();
    }

    public Map<String, Object> getSimulationStatus(Long busId) {
        SimulationTask task = activeSimulations.get(busId);
        Map<String, Object> status = new HashMap<>();
        status.put("busId", busId);
        if (task != null && !task.future.isCancelled()) {
            status.put("active", true);
            status.put("source", "SIMULATED");
            status.put("currentStep", task.currentIndex);
            status.put("totalSteps", task.path.size());
            status.put("runningForSeconds", (System.currentTimeMillis() - task.startTime) / 1000);
            Coordinate c = task.path.get(task.currentIndex);
            status.put("currentLat", c.lat);
            status.put("currentLng", c.lng);
            status.put("waypointName", c.name);
        } else {
            status.put("active", false);
            status.put("source", "REAL_GPS");
        }
        return status;
    }

    private List<Coordinate> generateRoutePath(Bus bus) {
        List<Coordinate> keyStops = new ArrayList<>();
        if (bus.getRoute() != null && bus.getRoute().getStops() != null && !bus.getRoute().getStops().isEmpty()) {
            for (RouteStop s : bus.getRoute().getStops()) {
                if (s.getLatitude() != null && s.getLongitude() != null) {
                    keyStops.add(new Coordinate(s.getLatitude(), s.getLongitude(), s.getStopName()));
                }
            }
        }

        // Fallback default realistic stops along Karedu -> Kandukur -> Ongole -> College corridor
        if (keyStops.size() < 2) {
            keyStops.clear();
            keyStops.add(new Coordinate(15.2050, 79.9200, "Karedu Bus Stop"));
            keyStops.add(new Coordinate(15.2150, 79.9000, "Kandukur Junction"));
            keyStops.add(new Coordinate(15.5050, 80.0490, "Ongole Bus Stand"));
            keyStops.add(new Coordinate(15.5250, 80.0650, "College Main Gate"));
        }

        // Smoothly interpolate 6 intermediate coordinates between consecutive key stops
        List<Coordinate> interpolatedPath = new ArrayList<>();
        for (int i = 0; i < keyStops.size() - 1; i++) {
            Coordinate start = keyStops.get(i);
            Coordinate end = keyStops.get(i + 1);
            int steps = 6;
            for (int s = 0; s < steps; s++) {
                double fraction = (double) s / steps;
                double lat = start.lat + (end.lat - start.lat) * fraction;
                double lng = start.lng + (end.lng - start.lng) * fraction;
                interpolatedPath.add(new Coordinate(
                        Math.round(lat * 100000.0) / 100000.0,
                        Math.round(lng * 100000.0) / 100000.0,
                        s == 0 ? start.name : "En Route to " + end.name
                ));
            }
        }
        interpolatedPath.add(keyStops.get(keyStops.size() - 1));

        return interpolatedPath;
    }

    private double calculateBearing(double lat1, double lng1, double lat2, double lng2) {
        double dLng = Math.toRadians(lng2 - lng1);
        double y = Math.sin(dLng) * Math.cos(Math.toRadians(lat2));
        double x = Math.cos(Math.toRadians(lat1)) * Math.sin(Math.toRadians(lat2)) -
                Math.sin(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.cos(dLng);
        double brng = Math.toDegrees(Math.atan2(y, x));
        return (brng + 360) % 360;
    }

    @PreDestroy
    public void cleanup() {
        log.info("Shutting down GPS Simulation service...");
        for (SimulationTask task : activeSimulations.values()) {
            try {
                task.future.cancel(true);
            } catch (Exception ignored) {}
        }
        activeSimulations.clear();
        scheduler.shutdownNow();
    }
}
