package com.buslink;

import com.buslink.dto.LocationUpdateRequest;
import com.buslink.entity.Bus;
import com.buslink.entity.BusLocationHistory;
import com.buslink.entity.Route;
import com.buslink.exception.InvalidGpsException;
import com.buslink.service.GpsIntegrityService;
import com.buslink.service.TrackingService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class TrackingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TrackingService trackingService;

    @Autowired
    private GpsIntegrityService gpsIntegrityService;

    @Test
    @DisplayName("1. Anonymous user accessing tracking APIs -> 401 Unauthorized")
    public void testAnonymousAccessToTrackingForbidden() throws Exception {
        mockMvc.perform(get("/api/tracking/buses/1/latest"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "student@buslink.com", roles = {"STUDENT"})
    @DisplayName("2. Student attempting to submit driver GPS coordinates -> 403 Forbidden")
    public void testStudentSubmittingGpsForbidden() throws Exception {
        String payload = """
            {
                "busId": 1,
                "latitude": 15.2050,
                "longitude": 79.9200,
                "source": "REAL_GPS"
            }
            """;
        mockMvc.perform(post("/api/tracking/location")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin@buslink.com", roles = {"ADMIN"})
    @DisplayName("3. Admin submitting valid real GPS telemetry -> 200 OK with REAL_GPS source")
    public void testAdminSubmittingRealGps() throws Exception {
        String payload = """
            {
                "busId": 1,
                "latitude": 15.2150,
                "longitude": 79.9300,
                "accuracy": 8.5,
                "speed": 35.0,
                "heading": 90.0,
                "source": "REAL_GPS"
            }
            """;
        mockMvc.perform(post("/api/tracking/location")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.trackingSource").value("REAL_GPS"))
                .andExpect(jsonPath("$.data.currentLat").value(15.2150))
                .andExpect(jsonPath("$.data.currentLng").value(79.9300));
    }

    @Test
    @WithMockUser(username = "admin@buslink.com", roles = {"ADMIN"})
    @DisplayName("4. Out of bounds GPS coordinates rejected -> 400 Bad Request")
    public void testOutOfBoundsGpsRejected() throws Exception {
        String payload = """
            {
                "busId": 1,
                "latitude": 195.0,
                "longitude": 80.0,
                "source": "REAL_GPS"
            }
            """;
        mockMvc.perform(post("/api/tracking/location")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "admin@buslink.com", roles = {"ADMIN"})
    @DisplayName("5. Start demonstration simulation -> 200 OK with SIMULATED active status")
    public void testStartAndStopSimulation() throws Exception {
        // Start simulation
        mockMvc.perform(post("/api/tracking/simulation/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"busId\": 1}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.active").value(true))
                .andExpect(jsonPath("$.data.source").value("SIMULATED"));

        // Check simulation status
        mockMvc.perform(get("/api/tracking/simulation/status/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.active").value(true));

        // Stop simulation
        mockMvc.perform(post("/api/tracking/simulation/stop")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"busId\": 1}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.active").value(false));
    }

    @Test
    @WithMockUser(username = "admin@buslink.com", roles = {"ADMIN"})
    @DisplayName("6. Admin retrieving bus location history -> 200 OK")
    public void testGetLocationHistory() throws Exception {
        mockMvc.perform(get("/api/tracking/buses/1/history?limit=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(username = "admin@buslink.com", roles = {"ADMIN"})
    @DisplayName("7. Admin retrieving bus route with configured stops -> 200 OK")
    public void testGetBusRoute() throws Exception {
        mockMvc.perform(get("/api/tracking/buses/1/route"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.stops").isArray());
    }

    @Test
    @WithMockUser(username = "admin@buslink.com", roles = {"ADMIN"})
    @DisplayName("8. Admin retrieving active fleet buses -> 200 OK")
    public void testGetActiveBusesAdmin() throws Exception {
        mockMvc.perform(get("/api/tracking/buses/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }
}
