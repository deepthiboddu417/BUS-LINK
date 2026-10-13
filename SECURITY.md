# BUS-LINK 2.0 — Production Security Specification

## Overview
BUS-LINK 2.0 is an enterprise-grade, secure Student Transportation, Tracking, Boarding, and Safety Management System. It implements robust authentication, fine-grained Role-Based Access Control (RBAC), server-side object-level authorization, GPS location integrity validation, brute-force defense, rate limiting, and immutable audit logging.

---

## Security Architecture & Controls

### 1. Authentication & JWT Token Management
- **Stateless JWT Authentication**: Passwords hashed with BCrypt. Short-lived Access Tokens paired with Refresh Tokens stored in DB.
- **Endpoints**:
  - `POST /api/auth/login` — Issues access + refresh tokens.
  - `POST /api/auth/register` — Validates role & provisions domain entities.
  - `POST /api/auth/refresh-token` — Rotates access tokens safely.
  - `POST /api/auth/logout` — Revokes refresh tokens instantly.

### 2. Method-Level & Object-Level Authorization
- Every controller endpoint uses Spring Security method security (`@PreAuthorize`) paired with strict backend ownership validation (`SecurityUtil`).
- **Student Boundaries**: Students access ONLY their own profile, boarding logs, and assigned bus.
- **Parent Boundaries**: Parents access ONLY children explicitly linked to their parent account (`student.getParent().getId().equals(currentParent.getId())`). Cross-parent child access is rejected with `HTTP 403 Forbidden`.
- **Driver Boundaries**: Drivers manage ONLY their assigned bus, trip, and passenger roster. Cross-driver bus operations are rejected with `HTTP 403 Forbidden`.
- **Admin Boundaries**: Administrators have full system administration privileges protected with `ROLE_ADMIN`.

### 3. Trip State Transition Enforcer
Enforces strict state flow:
`NOT_STARTED` → `STARTED` → `IN_TRANSIT` → `ARRIVED` → `COMPLETED`
Invalid transitions (e.g., `COMPLETED` → `STARTED`, `ARRIVED` → `IN_TRANSIT`, `NOT_STARTED` → `COMPLETED`) are rejected with `HTTP 422 Unprocessable Entity` or `HTTP 409 Conflict`.

### 4. Brute-Force & Account Lockout Defense
- Tracks failed login attempts per account/IP.
- Locks account after 5 consecutive failures for a 15-minute cooldown.
- Prevents credential enumeration by returning uniform `Invalid email or password` response.

### 5. API Rate Limiting (`RateLimitingFilter`)
- Token Bucket algorithm applied to sensitive endpoints:
  - `/api/auth/*` (10 requests/min)
  - `/api/boarding/*`, `/api/emergency/*`, `/api/buses/*/location` (60 requests/min)
- Exceeding limit returns `HTTP 429 Too Many Requests`.

### 6. GPS Location Integrity & Geofencing
- Coordinates validated against latitude `[-90, 90]` and longitude `[-180, 180]`.
- Haversine distance and speed (km/h) calculated between location updates. Speeds exceeding 120 km/h flag a `SUSPICIOUS_LOCATION` event.
- Active geofences (`BUS_STOP`, `COLLEGE`) trigger real-time notifications (`BUS_APPROACHING`, `BUS_ARRIVED_STOP`, `BUS_ARRIVED_COLLEGE`).

### 7. Emergency Alert Management
- Supports incident classification (`ACCIDENT`, `MEDICAL`, `BREAKDOWN`, `SECURITY`, `OTHER`).
- Driver raises alert -> Admin Security Center + Linked Parents receive instant notifications.
- Resolution tracked with `resolvedBy` and `resolvedAt`.

### 8. Immutable Audit Trail (`AuditLog`)
- Records security actions: `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `ACCESS_DENIED`, `BOARDING_CREATED`, `TRIP_STARTED`, `TRIP_COMPLETED`, `LOCATION_SUSPICIOUS`, `EMERGENCY_CREATED`.
- Searchable & filterable in Admin Security Center by role, result, action, and date range.

---

## How to Run & Verify

### Backend Server (Spring Boot)
```bash
cd backend
mvn spring-boot:run
```

### Frontend Server (React + Vite)
```bash
cd frontend
node server.js
```

### Automated Integration Security Suite
```bash
cd backend
mvn test
```
