package com.buslink.service;

import com.buslink.entity.Route;
import com.buslink.entity.RouteStop;
import com.buslink.exception.ResourceNotFoundException;
import com.buslink.repository.RouteRepository;
import com.buslink.repository.RouteStopRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RouteService {

    @Autowired
    private RouteRepository routeRepository;

    @Autowired
    private RouteStopRepository routeStopRepository;

    public List<Route> getAllRoutes() {
        return routeRepository.findAll();
    }

    public Route getRouteById(Long id) {
        return routeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + id));
    }

    @Transactional
    public Route createRoute(Route route) {
        if (route.getStops() != null) {
            for (RouteStop stop : route.getStops()) {
                stop.setRoute(route);
            }
        }
        return routeRepository.save(route);
    }

    @Transactional
    public Route updateRoute(Long id, Route updatedRoute) {
        Route existing = getRouteById(id);
        existing.setRouteName(updatedRoute.getRouteName());
        existing.setStartPoint(updatedRoute.getStartPoint());
        existing.setEndPoint(updatedRoute.getEndPoint());

        if (updatedRoute.getStops() != null) {
            existing.getStops().clear();
            for (RouteStop stop : updatedRoute.getStops()) {
                stop.setRoute(existing);
                existing.getStops().add(stop);
            }
        }

        return routeRepository.save(existing);
    }

    @Transactional
    public Route addStopToRoute(Long routeId, RouteStop stop) {
        Route route = getRouteById(routeId);
        route.addStop(stop);
        return routeRepository.save(route);
    }

    @Transactional
    public void deleteRoute(Long id) {
        Route route = getRouteById(id);
        routeRepository.delete(route);
    }
}
