package com.buslink.service;

import com.buslink.entity.SecurityEvent;
import com.buslink.repository.SecurityEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class BruteForceProtectionService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCK_TIME_DURATION_MINUTES = 15;

    private final Map<String, Integer> attemptsCache = new ConcurrentHashMap<>();
    private final Map<String, LocalDateTime> lockCache = new ConcurrentHashMap<>();

    @Autowired
    private SecurityEventRepository securityEventRepository;

    public void loginSucceeded(String key) {
        attemptsCache.remove(key);
        lockCache.remove(key);
    }

    public void loginFailed(String key, String ipAddress, Long userId) {
        int attempts = attemptsCache.getOrDefault(key, 0) + 1;
        attemptsCache.put(key, attempts);

        securityEventRepository.save(new SecurityEvent(
                "LOGIN_FAILED",
                userId,
                ipAddress,
                "MEDIUM",
                "Failed login attempt (" + attempts + "/" + MAX_FAILED_ATTEMPTS + ") for target: " + key
        ));

        if (attempts >= MAX_FAILED_ATTEMPTS) {
            lockCache.put(key, LocalDateTime.now().plusMinutes(LOCK_TIME_DURATION_MINUTES));
            securityEventRepository.save(new SecurityEvent(
                    "ACCOUNT_LOCKED",
                    userId,
                    ipAddress,
                    "HIGH",
                    "Account locked due to " + MAX_FAILED_ATTEMPTS + " consecutive failed attempts for target: " + key
            ));
        }
    }

    public boolean isBlocked(String key) {
        if (lockCache.containsKey(key)) {
            LocalDateTime lockExpiration = lockCache.get(key);
            if (LocalDateTime.now().isBefore(lockExpiration)) {
                return true;
            } else {
                lockCache.remove(key);
                attemptsCache.remove(key);
            }
        }
        return false;
    }

    public int getRemainingAttempts(String key) {
        int attempts = attemptsCache.getOrDefault(key, 0);
        return Math.max(0, MAX_FAILED_ATTEMPTS - attempts);
    }
}
