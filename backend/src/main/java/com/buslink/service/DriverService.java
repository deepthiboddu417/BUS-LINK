package com.buslink.service;

import com.buslink.entity.Driver;
import com.buslink.exception.ResourceNotFoundException;
import com.buslink.exception.UnauthorizedAccessException;
import com.buslink.repository.DriverRepository;
import com.buslink.security.SecurityUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DriverService {

    @Autowired
    private DriverRepository driverRepository;

    public List<Driver> getAllDrivers() {
        return driverRepository.findAll();
    }

    public Driver getDriverById(Long id) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with id: " + id));

        validateDriverAccess(driver);
        return driver;
    }

    public Driver getDriverByEmail(String email) {
        Driver driver = driverRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with email: " + email));

        validateDriverAccess(driver);
        return driver;
    }

    public void validateDriverAccess(Driver driver) {
        if (SecurityUtil.isAdmin()) {
            return; // Admin allowed
        }
        String currentEmail = SecurityUtil.getCurrentUserEmail();
        if (driver.getUser() == null || !driver.getUser().getEmail().equalsIgnoreCase(currentEmail)) {
            throw new UnauthorizedAccessException("Access Denied: You cannot modify or access another driver's record");
        }
    }

    @Transactional
    public Driver updateDriver(Long id, Driver updated) {
        Driver existing = getDriverById(id);
        existing.setLicenseNumber(updated.getLicenseNumber());
        if (updated.getUser() != null) {
            existing.getUser().setName(updated.getUser().getName());
            existing.getUser().setPhone(updated.getUser().getPhone());
        }
        return driverRepository.save(existing);
    }

    @Transactional
    public void deleteDriver(Long id) {
        Driver driver = getDriverById(id);
        driverRepository.delete(driver);
    }
}
