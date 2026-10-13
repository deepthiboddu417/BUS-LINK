package com.buslink.service;

import com.buslink.entity.Bus;
import com.buslink.entity.Driver;
import com.buslink.entity.Route;
import com.buslink.entity.TripStatus;
import com.buslink.exception.BadRequestException;
import com.buslink.exception.ResourceNotFoundException;
import com.buslink.repository.BusRepository;
import com.buslink.repository.DriverRepository;
import com.buslink.repository.RouteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BusService {

    @Autowired
    private BusRepository busRepository;

    @Autowired
    private RouteRepository routeRepository;

    @Autowired
    private DriverRepository driverRepository;

    public List<Bus> getAllBuses() {
        return busRepository.findAll();
    }

    public Bus getBusById(Long id) {
        return busRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + id));
    }

    @Transactional
    public Bus createBus(Bus bus) {
        if (busRepository.findByBusNumber(bus.getBusNumber()).isPresent()) {
            throw new BadRequestException("Bus number " + bus.getBusNumber() + " already exists!");
        }
        if (bus.getStatus() == null) {
            bus.setStatus(TripStatus.NOT_STARTED);
        }
        return busRepository.save(bus);
    }

    @Transactional
    public Bus updateBus(Long id, Bus updatedBus) {
        Bus existing = getBusById(id);
        existing.setBusNumber(updatedBus.getBusNumber());
        existing.setCapacity(updatedBus.getCapacity());
        if (updatedBus.getRoute() != null && updatedBus.getRoute().getId() != null) {
            Route route = routeRepository.findById(updatedBus.getRoute().getId()).orElse(null);
            existing.setRoute(route);
        }
        if (updatedBus.getDriver() != null && updatedBus.getDriver().getId() != null) {
            Driver driver = driverRepository.findById(updatedBus.getDriver().getId()).orElse(null);
            existing.setDriver(driver);
        }
        return busRepository.save(existing);
    }

    @Transactional
    public Bus assignDriver(Long busId, Long driverId) {
        Bus bus = getBusById(busId);
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with id: " + driverId));
        bus.setDriver(driver);
        return busRepository.save(bus);
    }

    @Transactional
    public Bus assignRoute(Long busId, Long routeId) {
        Bus bus = getBusById(busId);
        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + routeId));
        bus.setRoute(route);
        return busRepository.save(bus);
    }

    @Transactional
    public void deleteBus(Long id) {
        Bus bus = getBusById(id);
        busRepository.delete(bus);
    }
}
