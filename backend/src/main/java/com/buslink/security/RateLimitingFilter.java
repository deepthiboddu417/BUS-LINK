package com.buslink.security;

import com.buslink.service.RateLimiterService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    @Autowired
    private RateLimiterService rateLimiterService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        // Target rate limited endpoints
        boolean isProtectedEndpoint = path.startsWith("/api/auth/") ||
                path.startsWith("/api/boarding/") ||
                path.startsWith("/api/emergency/") ||
                path.startsWith("/api/location/");

        if (isProtectedEndpoint && ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method))) {
            String clientIp = getClientIp(request);
            String endpointType = path.startsWith("/api/auth/") ? "AUTH" : "API";

            try {
                rateLimiterService.checkRateLimit(clientIp, endpointType);
            } catch (Exception ex) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write("{\"success\":false,\"message\":\"Too Many Requests: Rate limit exceeded for sensitive operation. Please try again later.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
