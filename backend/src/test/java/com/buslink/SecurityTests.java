package com.buslink;

import com.buslink.dto.AuthRequest;
import com.buslink.dto.AuthResponse;
import com.buslink.entity.Role;
import com.buslink.repository.UserRepository;
import com.buslink.service.AuthService;
import com.buslink.service.BruteForceProtectionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class SecurityTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BruteForceProtectionService bruteForceService;

    @Test
    public void testSuccessfulAdminLogin() {
        AuthRequest request = new AuthRequest("admin@buslink.com", "Admin@123");
        AuthResponse response = authService.login(request, "127.0.0.1");

        assertNotNull(response.getToken());
        assertEquals("admin@buslink.com", response.getEmail());
        assertEquals(Role.ROLE_ADMIN, response.getRole());
    }

    @Test
    public void testFailedLoginWrongPassword() {
        AuthRequest request = new AuthRequest("admin@buslink.com", "WrongPassword123");

        assertThrows(BadCredentialsException.class, () -> {
            authService.login(request, "127.0.0.1");
        });
    }

    @Test
    public void testBruteForceAccountLockout() {
        String testEmail = "lockout_test@buslink.com";

        // Simulate 5 failed attempts
        for (int i = 1; i <= 5; i++) {
            bruteForceService.loginFailed(testEmail, "127.0.0.1", null);
        }

        // Verify account is blocked
        assertTrue(bruteForceService.isBlocked(testEmail));
    }
}
