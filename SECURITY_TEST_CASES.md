# BUS-LINK 2.0 — Security Integration Test Matrix

| Test ID | Security Scenario / Attack Vector | Request Method & Endpoint | Expected Response | Actual Test Status |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Anonymous user accessing protected student endpoint without JWT | `GET /api/students/1` | `HTTP 401 Unauthorized` | **PASSED** |
| **SEC-02** | Student attempting to access admin security metrics | `GET /api/admin/security/metrics` | `HTTP 403 Forbidden` | **PASSED** |
| **SEC-03** | Parent attempting to view another parent's child boarding history | `GET /api/parents/1/children/2/boarding-history` | `HTTP 403 Forbidden` | **PASSED** |
| **SEC-04** | Student attempting to delete student record | `DELETE /api/students/2` | `HTTP 403 Forbidden` | **PASSED** |
| **SEC-05** | Driver attempting admin route deletion | `DELETE /api/routes/1` | `HTTP 403 Forbidden` | **PASSED** |
| **SEC-06** | Request with invalid / forged JWT token string | `GET /api/students/1` (Header: `Bearer invalid.jwt`) | `HTTP 401 Unauthorized` | **PASSED** |
| **SEC-07** | Request with malformed auth header (Basic Auth) | `GET /api/students/1` (Header: `Basic ...`) | `HTTP 401 Unauthorized` | **PASSED** |
| **SEC-08** | Invalid password credentials during login | `POST /api/auth/login` (Wrong pass) | `HTTP 401 Unauthorized` | **PASSED** |
| **SEC-09** | Out-of-bounds GPS coordinates validation | `GpsIntegrityService.validateGpsCoordinates(999, 80)` | `InvalidGpsException` | **PASSED** |
| **SEC-10** | Unrealistic speed jump detection (>120 km/h) | `GpsIntegrityService.evaluateLocationIntegrity(...)` | `Flagged as Suspicious` | **PASSED** |
| **SEC-11** | Invalid Trip State Transition enforcement | `TripService.endTrip(nonExistentOrCompleted)` | `InvalidTripTransitionException` | **PASSED** |
| **SEC-12** | Duplicate boarding record prevention | `BoardingService.recordBoarding(studentId)` (x2) | `BadRequestException` (Rejected) | **PASSED** |
| **SEC-13** | Admin accessing Security Center metrics | `GET /api/admin/security/metrics` | `HTTP 200 OK` | **PASSED** |
| **SEC-14** | Admin retrieving filterable audit logs | `GET /api/admin/security/audit-logs` | `HTTP 200 OK` | **PASSED** |

---

## Test Execution Summary
- **Total Test Cases Executed**: 14
- **Passed**: 14 (100%)
- **Failed**: 0
- **Execution Environment**: Spring Boot Integration Test (`BusLinkSecurityIntegrationTest.java`)
