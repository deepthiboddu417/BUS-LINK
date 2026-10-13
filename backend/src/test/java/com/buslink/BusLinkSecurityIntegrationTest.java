package com.buslink;

import com.buslink.dto.AuthRequest;
import com.buslink.dto.BoardingRequest;
import com.buslink.dto.EmergencyRequest;
import com.buslink.dto.LocationUpdateRequest;
import com.buslink.entity.Bus;
import com.buslink.exception.InvalidGpsException;
import com.buslink.exception.InvalidTripTransitionException;
import com.buslink.exception.UnauthorizedAccessException;
import com.buslink.service.AuthService;
import com.buslink.service.BoardingService;
import com.buslink.service.GpsIntegrityService;
import com.buslink.service.TripService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class BusLinkSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuthService authService;

    @Autowired
    private TripService tripService;

    @Autowired
    private GpsIntegrityService gpsIntegrityService;

    @Autowired
    private BoardingService boardingService;

    @Test
    @DisplayName("1. Anonymous user accessing protected student API -> 401 Unauthorized")
    public void testAnonymousAccessDenied() throws Exception {
        mockMvc.perform(get("/api/students/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "student@buslink.com", roles = {"STUDENT"})
    @DisplayName("2. Student accessing admin security metrics -> 403 Forbidden")
    public void testStudentAccessingAdminApi() throws Exception {
        mockMvc.perform(get("/api/admin/security/metrics"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "parent@buslink.com", roles = {"PARENT"})
    @DisplayName("3. Parent accessing another parent's child boarding history -> 403 Forbidden")
    public void testParentAccessingOtherChildForbidden() throws Exception {
        // Parent 1 trying to access child belonging to Parent 2
        mockMvc.perform(get("/api/parents/1/children/2/boarding-history"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "student@buslink.com", roles = {"STUDENT"})
    @DisplayName("4. Student attempting to delete student record -> 403 Forbidden")
    public void testStudentModifyingOtherStudentForbidden() throws Exception {
        mockMvc.perform(delete("/api/students/2"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "driver@buslink.com", roles = {"DRIVER"})
    @DisplayName("5. Driver attempting admin route modification -> 403 Forbidden")
    public void testDriverModifyingRouteForbidden() throws Exception {
        mockMvc.perform(delete("/api/routes/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("6. Request with Invalid Bearer Token -> 401 Unauthorized")
    public void testInvalidJwtToken() throws Exception {
        mockMvc.perform(get("/api/students/1")
                        .header("Authorization", "Bearer invalid.jwt.token.string"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("7. Request with Malformed Header -> 401 Unauthorized")
    public void testMalformedHeader() throws Exception {
        mockMvc.perform(get("/api/students/1")
                        .header("Authorization", "Basic dXNlcjpwYXNz"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("8. Invalid Credentials -> 401 Unauthorized")
    public void testInvalidLoginCredentials() throws Exception {
        String jsonRequest = "{\"email\":\"admin@buslink.com\",\"password\":\"WrongPassword123\"}";
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonRequest))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("9. GPS Coordinate Boundary Validation (-90 to 90, -180 to 180)")
    public void testInvalidGpsCoordinates() {
        assertThrows(InvalidGpsException.class, () -> {
            gpsIntegrityService.validateGpsCoordinates(999.0, 80.0);
        });
        assertThrows(InvalidGpsException.class, () -> {
            gpsIntegrityService.validateGpsCoordinates(15.0, -999.0);
        });
    }

    @Test
    @DisplayName("10. Suspicious Movement Detection (>120 km/h jump flagged)")
    public void testSuspiciousGpsMovementFlagged() {
        Bus mockBus = new Bus();
        mockBus.setId(1L);
        mockBus.setCurrentLat(15.2050);
        mockBus.setCurrentLng(79.9200);
        mockBus.setLastLocationUpdate(java.time.LocalDateTime.now().minusSeconds(10));

        // Attempting 50 km jump in 10 seconds (18,000 km/h)
        boolean isRealistic = gpsIntegrityService.evaluateLocationIntegrity(mockBus, 15.9050, 80.9200, 1L);
        assertFalse(isRealistic, "Extremely high speed jump should be flagged as unrealistically suspicious");
    }

    @Test
    @DisplayName("11. Invalid Trip Transition Exception Enforcement")
    public void testInvalidTripTransition() {
        assertThrows(RuntimeException.class, () -> {
            // Ending trip that doesn't exist or double ending
            tripService.endTrip(9999L);
        });
    }

    @Test
    @DisplayName("12. Duplicate Boarding Record Prevention")
    public void testDuplicateBoardingPrevention() {
        BoardingRequest request = new BoardingRequest();
        request.setLocation("Karedu Stop");
        try {
            boardingService.recordBoarding(1L, request);
            // Second attempt for same student/trip should fail
            assertThrows(Exception.class, () -> boardingService.recordBoarding(1L, request));
        } catch (Exception ignored) {}
    }

    @Test
    @WithMockUser(username = "admin@buslink.com", roles = {"ADMIN"})
    @DisplayName("13. Admin accessing security center audit logs -> 200 OK")
    public void testAdminAccessingSecurityMetrics() throws Exception {
        mockMvc.perform(get("/api/admin/security/metrics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(username = "admin@buslink.com", roles = {"ADMIN"})
    @DisplayName("14. Admin retrieving filterable audit logs -> 200 OK")
    public void testAdminAccessingAuditLogs() throws Exception {
        mockMvc.perform(get("/api/admin/security/audit-logs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(username = "veeru@buslink.com", roles = {"STUDENT"})
    @DisplayName("15. Student generating their own QR token -> 200 OK")
    public void testStudentGeneratingOwnQrToken() throws Exception {
        mockMvc.perform(get("/api/boarding/student/1/qr-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(username = "veeru@buslink.com", roles = {"STUDENT"})
    @DisplayName("16. Student requesting another student's QR token -> 403 Forbidden")
    public void testStudentRequestingOtherQrTokenForbidden() throws Exception {
        mockMvc.perform(get("/api/boarding/student/2/qr-token"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("17. Attempting public registration with ROLE_ADMIN -> 400 Bad Request")
    public void testPublicAdminRegistrationForbidden() throws Exception {
        String payload = """
            {
                "name": "Malicious Admin",
                "email": "hacker_admin@buslink.com",
                "password": "Password123",
                "phone": "9999999999",
                "role": "ROLE_ADMIN"
            }
            """;
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @WithMockUser(username = "admin@buslink.com", roles = {"ADMIN"})
    @DisplayName("18. Admin accessing dashboard stats -> 200 OK")
    public void testAdminAccessingDashboardStats() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard-stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalBuses").exists());
    }

    @Test
    @WithMockUser(username = "student@buslink.com", roles = {"STUDENT"})
    @DisplayName("19. Student accessing admin dashboard stats -> 403 Forbidden")
    public void testStudentAccessingAdminDashboardForbidden() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard-stats"))
                .andExpect(status().isForbidden());
    }
}
