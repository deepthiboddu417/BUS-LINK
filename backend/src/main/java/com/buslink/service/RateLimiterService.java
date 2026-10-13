package com.buslink.service;

import com.buslink.exception.RateLimitExceededException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimiterService {

    private static final int MAX_REQUESTS_PER_MINUTE = 60; // Configurable limit
    private static final int AUTH_REQUESTS_PER_MINUTE = 10; // Stricter for auth

    private final Map<String, TokenBucket> buckets = new ConcurrentHashMap<>();

    public boolean tryConsume(String key, int maxLimit) {
        TokenBucket bucket = buckets.computeIfAbsent(key, k -> new TokenBucket(maxLimit, 60));
        return bucket.tryConsume();
    }

    public void checkRateLimit(String clientKey, String endpointType) {
        int limit = endpointType.equalsIgnoreCase("AUTH") ? AUTH_REQUESTS_PER_MINUTE : MAX_REQUESTS_PER_MINUTE;
        String bucketKey = endpointType + ":" + clientKey;

        if (!tryConsume(bucketKey, limit)) {
            throw new RateLimitExceededException("Rate limit exceeded for endpoint [" + endpointType + "]. Maximum " + limit + " requests allowed per minute.");
        }
    }

    private static class TokenBucket {
        private final int capacity;
        private final long refillIntervalSeconds;
        private int tokens;
        private Instant lastRefillTimestamp;

        public TokenBucket(int capacity, long refillIntervalSeconds) {
            this.capacity = capacity;
            this.refillIntervalSeconds = refillIntervalSeconds;
            this.tokens = capacity;
            this.lastRefillTimestamp = Instant.now();
        }

        public synchronized boolean tryConsume() {
            refill();
            if (tokens > 0) {
                tokens--;
                return true;
            }
            return false;
        }

        private void refill() {
            Instant now = Instant.now();
            long elapsedSeconds = now.getEpochSecond() - lastRefillTimestamp.getEpochSecond();
            if (elapsedSeconds >= refillIntervalSeconds) {
                tokens = capacity;
                lastRefillTimestamp = now;
            }
        }
    }
}
