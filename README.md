# 🚌 BUS-LINK — Smart Student Bus Tracking System

> *Connected Buses. Safer Journeys.*

**BUS-LINK** is a full-stack college student transportation and fleet safety management platform built with **Java 21 + Spring Boot 3**, **React 18**, and **H2/MySQL**. It provides real-time GPS bus tracking, cryptographic QR-code boarding attendance, role-based dashboards for students, parents, drivers, and admins, emergency SOS dispatch, and a security audit log.

---

## 📋 Table of Contents

- [Problem Statement](#problem-statement)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Database Configuration](#database-configuration)
- [Demo Accounts](#demo-accounts)
- [API Documentation](#api-documentation)
- [Security Architecture](#security-architecture)
- [Screenshots](#screenshots)
- [Known Limitations](#known-limitations)
- [Future Enhancements](#future-enhancements)
- [License](#license)

---

## 🎯 Problem Statement

Traditional college bus systems have no real-time visibility. Parents cannot track buses live. Drivers use paper registers for attendance. Admins have no fleet-wide safety dashboard. BUS-LINK digitises the entire workflow:

- Students board with a cryptographic QR pass — no paper slips.
- Parents see their child's bus location live on a map.
- Drivers get a digital passenger roster and a QR scanner.
- Admins manage routes, buses, drivers, and review security audit logs.

---

## ✨ Features

### 🎓 Student Dashboard
- View assigned bus, driver, and route details
- Generate a time-limited cryptographic QR boarding pass (120-second HMAC expiry)
- Trigger emergency SOS alert
- View personal journey and boarding history

### 👨‍👩‍👦 Parent Dashboard
- Live Leaflet/OpenStreetMap bus tracking for linked child's assigned bus
- Instant boarding notifications when child scans aboard
- Boarding history and journey safety timeline
- Emergency alert panel

### 🚌 Driver Dashboard
- Start / stop a trip and manage the passenger roster
- Scan student QR codes for boarding verification
- Share real GPS location from the browser (HTTPS required) or run a simulated demo route
- Emergency SOS panel

### 🛡️ Admin Dashboard
- Full fleet management: buses, routes, students, parents, drivers
- Trip management and attendance records
- Security centre: live audit log, brute-force lockout monitoring, rate-limit status
- Emergency alert resolution and incident management

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, React Router v6, Axios, Lucide React |
| **Maps** | Leaflet.js 1.9 + React-Leaflet 4.2, OpenStreetMap tiles |
| **QR Code** | html5-qrcode (scanning), qrcode (generation), Google ZXing (backend) |
| **Backend** | Java 21, Spring Boot 3.2, Spring Security 6, Spring WebSocket |
| **Auth** | JWT (JJWT 0.11, HMAC-SHA256), BCrypt password hashing |
| **Database** | H2 in-memory (dev default), MySQL 8.0 (production profile) |
| **ORM** | Spring Data JPA + Hibernate 6 |
| **API Docs** | SpringDoc OpenAPI 3 / Swagger UI |
| **Build Tools** | Maven 3.9 (backend), Node.js / npm (frontend) |
| **Containers** | Docker + Docker Compose |

---

## 📁 Project Structure

```
BUS-LINK/
├── backend/
│   ├── src/main/java/com/buslink/
│   │   ├── config/          # Security, WebSocket, CORS config
│   │   ├── controller/      # 15 REST controllers (Auth, Tracking, Boarding, etc.)
│   │   ├── dto/             # Request/Response DTOs
│   │   ├── entity/          # JPA entities (Bus, Route, Student, Trip, AuditLog…)
│   │   ├── repository/      # Spring Data JPA repositories
│   │   ├── security/        # JWT filter, rate limiter, user details service
│   │   ├── service/         # Business logic services
│   │   └── BusLinkApplication.java
│   ├── src/main/resources/
│   │   └── application.properties.example   # ← safe config template
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/       # AdminDashboard, RouteManagement, BusManagement…
│   │   │   ├── driver/      # DriverDashboard, ScanQr, LocationSharing…
│   │   │   ├── parent/      # ParentDashboard, TrackBus, BoardingHistory…
│   │   │   └── student/     # StudentDashboard, Boarding, MyBus…
│   │   ├── context/         # AuthContext (global login state)
│   │   ├── services/        # api.js (Axios client + interceptors)
│   │   └── App.jsx
│   ├── server.js            # Custom dev server (HTTP + HTTPS, /api proxy)
│   ├── package.json
│   └── index.html
├── .env.example             # Environment variable template
├── docker-compose.yml       # MySQL + backend + frontend containers
└── README.md
```

---

## ✅ Prerequisites

| Tool | Minimum Version | Download |
|---|---|---|
| Java JDK | 21 | [adoptium.net](https://adoptium.net) |
| Maven | 3.9 | [maven.apache.org](https://maven.apache.org/download.cgi) |
| Node.js | 18 LTS | [nodejs.org](https://nodejs.org) |
| Git | any | [git-scm.com](https://git-scm.com) |
| MySQL *(optional)* | 8.0 | [dev.mysql.com](https://dev.mysql.com/downloads/) |

> **H2 database is the default.** MySQL is not required to run the project locally.

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/deepthiboodu417/BUS-LINK.git
cd BUS-LINK
```

### 2. Configure the Backend

```bash
cd backend/src/main/resources
copy application.properties.example application.properties
```

Open `application.properties` and set your own values — especially:

```properties
# Generate a strong secret: openssl rand -hex 32
app.jwt.secret=${APP_JWT_SECRET:your-own-secret-here}
```

> ⚠️ `application.properties` is in `.gitignore` and must never be committed.

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
```

---

## ▶️ Running the Application

### Backend (Spring Boot)

```powershell
cd backend
mvn spring-boot:run
```

- API base: `http://localhost:8080`
- H2 console: `http://localhost:8080/h2-console`
- Swagger UI: `http://localhost:8080/swagger-ui.html`

### Frontend (React Dev Server)

```powershell
cd frontend
node server.js
```

- HTTP: `http://localhost:5173`
- HTTPS (mobile GPS): `https://localhost:5174`

> The frontend proxies all `/api` requests to the backend automatically.

### Docker (All Services)

```bash
# Set required environment variable first
export APP_JWT_SECRET=$(openssl rand -hex 32)
docker-compose up --build
```

Services started:
- MySQL on port `3306`
- Backend on port `8080`
- Frontend on port `5173`

---

## 🗄️ Database Configuration

### Default: H2 In-Memory (No Setup Required)

The project ships with H2 in MySQL-compatibility mode. The database is created automatically on startup and reset on each restart. This is suitable for development and demos.

```properties
spring.datasource.url=jdbc:h2:mem:buslink_db;DB_CLOSE_DELAY=-1;MODE=MySQL
```

Access the H2 console at `http://localhost:8080/h2-console`:
- JDBC URL: `jdbc:h2:mem:buslink_db`
- Username: `sa`
- Password: *(leave empty)*

### Production: MySQL 8.0

Uncomment the MySQL block in your local `application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/buslink_db?useSSL=false&serverTimezone=UTC
spring.datasource.username=YOUR_USERNAME
spring.datasource.password=YOUR_PASSWORD
spring.datasource.driverClassName=com.mysql.cj.jdbc.Driver
spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect
```

Create the database before starting:
```sql
CREATE DATABASE buslink_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Hibernate creates the schema automatically (`ddl-auto=update`).

---

## 🔐 Demo Accounts

These test accounts are seeded automatically when the application starts in dev mode (H2 database). They are useful for exploring the application.

| Role | Email | Default Password |
|---|---|---|
| Admin | `admin@buslink.com` | Set via `BUSLINK_ADMIN_PASSWORD` env var (default documented in `application.properties.example`) |
| Student | `student@buslink.com` | Auto-seeded dev account |
| Parent | `parent@buslink.com` | Auto-seeded dev account |
| Driver | `driver@buslink.com` | Auto-seeded dev account |

> **Note:** Default dev passwords are defined in `application.properties.example`. Do not reuse these passwords in production. In a production deployment, set `BUSLINK_ADMIN_EMAIL` and `BUSLINK_ADMIN_PASSWORD` as environment variables and change all seeded account passwords immediately.

---

## 📖 API Documentation

Interactive Swagger UI is available when the backend is running:

```
http://localhost:8080/swagger-ui.html
```

Key API groups:

| Prefix | Description |
|---|---|
| `/api/auth` | Login, register, refresh token, logout |
| `/api/tracking` | GPS location submit, bus history, active buses, simulation |
| `/api/boarding` | QR token generation, QR scan, boarding records |
| `/api/buses` | Bus CRUD, capacity management |
| `/api/routes` | Route and stop management |
| `/api/students` | Student profiles, assignments |
| `/api/drivers` | Driver assignments, attendance |
| `/api/admin` | Fleet overview, user management |
| `/api/emergency` | SOS alerts, incident reports |

---

## 🛡️ Security Architecture

| Feature | Implementation |
|---|---|
| **Authentication** | JWT (HMAC-SHA256), 24-hour expiry |
| **Password Storage** | BCrypt, work factor 10 |
| **Role-Based Access Control** | `@PreAuthorize` on every endpoint (ADMIN, STUDENT, PARENT, DRIVER) |
| **IDOR Prevention** | Server-side identity checks prevent URL-based data tampering |
| **Brute-Force Protection** | Account locked after 5 failed login attempts (15-min window) |
| **Rate Limiting** | 60 requests/minute per IP (returns HTTP 429) |
| **QR Anti-Fraud** | HMAC-SHA256 signed tokens with 120-second replay window |
| **Audit Logging** | All auth events, QR scans, SOS alerts logged to `audit_log` table |
| **Bus Capacity Guard** | Prevents student assignment beyond bus seat limit |

---

## 📸 Screenshots

> Screenshots coming soon. Run the project locally and use the one-click demo accounts to explore each dashboard.

| View | Description |
|---|---|
| Login Page | Role-based quick-demo login buttons |
| Student Dashboard | QR boarding pass, bus details, SOS button |
| Parent Dashboard | Live Leaflet map with bus marker |
| Driver Dashboard | Trip control, QR scanner, passenger list |
| Admin Dashboard | Fleet metrics, route management, audit logs |

---

## ⚠️ Known Limitations

1. **Browser GPS Background Tracking** — The W3C Geolocation API requires an active foreground browser tab on an HTTPS origin. When the mobile screen is locked or the browser is minimised, the OS throttles or suspends JavaScript timers. For 24/7 tracking in production, a native Android/iOS background service or dedicated GPS hardware (OBD-II / AIS-140) transmitting to `POST /api/tracking/location` is required.

2. **H2 is In-Memory** — All data is lost when the backend process restarts. Switch to MySQL for persistent data.

3. **Self-Signed HTTPS Certificate** — The HTTPS dev server on port 5174 uses a dynamically generated self-signed certificate. Browsers will show a security warning; you must click "Proceed anyway" for mobile GPS to work.

4. **No Email Notifications** — The system architecture supports an optional mail server configuration, but outbound email is not active in the default dev setup.

5. **Demo Only — Not Production Deployed** — This project is a functional prototype running locally. It has not been deployed to a cloud provider or tested under production traffic.

---

## 🔮 Future Enhancements

- [ ] Native Android/iOS app for background GPS tracking (AIS-140 compliance)
- [ ] Push notifications via Firebase Cloud Messaging (FCM)
- [ ] Persistent file storage for student/driver profile photos (S3 / MinIO)
- [ ] Multi-institution / multi-campus support
- [ ] Route optimisation engine (Google OR-Tools / OSRM)
- [ ] Production deployment guides (Railway, Render, AWS EC2)
- [ ] Automated CI/CD pipeline (GitHub Actions)
- [ ] Comprehensive integration test coverage

---

## 📄 License

This project is released for educational and portfolio purposes. No open-source license is currently attached. Contact the author before using any part of this code in commercial or production systems.

---

*Built with ❤️ as a full-stack portfolio project.*
