package com.buslink.controller;

import com.buslink.dto.ApiResponse;
import com.buslink.entity.Route;
import com.buslink.entity.RouteStop;
import com.buslink.service.RouteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/routes")
public class RouteController {

    @Autowired
    private RouteService routeService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER', 'STUDENT', 'PARENT')")
    public ResponseEntity<ApiResponse<List<Route>>> getAllRoutes() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Routes retrieved", routeService.getAllRoutes()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER', 'STUDENT', 'PARENT')")
    public ResponseEntity<ApiResponse<Route>> getRouteById(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Route retrieved", routeService.getRouteById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Route>> createRoute(@RequestBody Route route) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Route created successfully", routeService.createRoute(route)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Route>> updateRoute(@PathVariable Long id, @RequestBody Route route) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Route updated successfully", routeService.updateRoute(id, route)));
    }

    @PostMapping("/{id}/stops")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Route>> addStop(@PathVariable Long id, @RequestBody RouteStop stop) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Stop added to route", routeService.addStopToRoute(id, stop)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteRoute(@PathVariable Long id) {
        routeService.deleteRoute(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Route deleted successfully"));
    }
}
