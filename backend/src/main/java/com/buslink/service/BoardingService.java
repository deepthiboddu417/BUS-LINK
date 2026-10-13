package com.buslink.service;

import com.buslink.dto.BoardingRequest;
import com.buslink.dto.DriverScanRequest;
import com.buslink.dto.StudentQrPassResponse;
import com.buslink.entity.*;
import com.buslink.exception.BadRequestException;
import com.buslink.exception.ResourceNotFoundException;
import com.buslink.exception.UnauthorizedAccessException;
import com.buslink.repository.BoardingAttendanceRepository;
import com.buslink.repository.BusRepository;
import com.buslink.repository.StudentRepository;
import com.buslink.repository.TripRepository;
import com.buslink.security.SecurityUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;

@Service
public class BoardingService {

    @Autowired
    private BoardingAttendanceRepository boardingRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private BusRepository busRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private QrCodeGeneratorService qrCodeGeneratorService;

    @Transactional
    public BoardingAttendance recordBoarding(Long studentId, BoardingRequest request) {
        // Step 1: Find student
        Student student = studentRepository.findById(studentId)
                .or(() -> studentRepository.findByUserEmail(studentId.toString()))
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id/email: " + studentId));

        // Step 2: Validate student is assigned to bus
        Bus bus = student.getBus();
        if (bus == null) {
            throw new BadRequestException("Student is not assigned to any bus. Contact admin.");
        }

        // Validate driver authorization for bus
        if (SecurityUtil.hasRole("DRIVER") && !SecurityUtil.isAdmin()) {
            String currentEmail = SecurityUtil.getCurrentUserEmail();
            if (bus.getDriver() == null || bus.getDriver().getUser() == null ||
                    !bus.getDriver().getUser().getEmail().equalsIgnoreCase(currentEmail)) {
                throw new UnauthorizedAccessException("Access Denied: Driver can only record boarding for their assigned bus");
            }
        }

        // Prevent student self-service boarding bypass
        if (SecurityUtil.hasRole("STUDENT") && !SecurityUtil.isAdmin() && !SecurityUtil.hasRole("DRIVER")) {
            throw new UnauthorizedAccessException("Access Denied: Self-service boarding is prohibited. Boarding attendance must be verified by the bus driver scanning your QR pass.");
        }

        // Step 3: Find active trip
        Trip trip = null;
        if (request.getTripId() != null) {
            trip = tripRepository.findById(request.getTripId())
                    .orElseThrow(() -> new ResourceNotFoundException("Trip not found"));
        } else {
            trip = tripRepository.findTopByBusIdAndStatusInOrderByStartTimeDesc(
                    bus.getId(), Arrays.asList(TripStatus.STARTED, TripStatus.IN_TRANSIT)
            ).orElseGet(() -> tripRepository.findTopByBusIdOrderByStartTimeDesc(bus.getId()).orElse(null));
        }

        if (trip == null) {
            Trip autoTrip = new Trip(bus, bus.getDriver(), bus.getRoute(), TripStatus.STARTED, LocalDate.now());
            autoTrip.setStartTime(LocalDateTime.now());
            trip = tripRepository.save(autoTrip);
            bus.setStatus(TripStatus.STARTED);
            busRepository.save(bus);
        }

        // Step 4: Check for duplicate attendance
        if (boardingRepository.findByStudentIdAndTripId(student.getId(), trip.getId()).isPresent()) {
            auditLogService.logUserAction(SecurityUtil.getCurrentUserPrincipal(), "BOARDING_DUPLICATE_REJECTED", "Student", student.getId().toString(), null, "DENIED", "Duplicate boarding attempt rejected");
            throw new BadRequestException("Duplicate Boarding Rejected: Student " + (student.getUser() != null ? student.getUser().getName() : "") + " (" + student.getStudentIdCode() + ") has already boarded for this trip.");
        }

        // Step 5: Save Boarding Attendance
        LocalDateTime now = LocalDateTime.now();
        String location = (request.getLocation() != null && !request.getLocation().isBlank())
                ? request.getLocation()
                : (bus.getRoute() != null ? bus.getRoute().getStartPoint() : "Main Stop");

        BoardingAttendance attendance = new BoardingAttendance(
                student, bus, trip, LocalDate.now(), now, location, "BOARDED"
        );
        attendance = boardingRepository.save(attendance);

        auditLogService.logUserAction(SecurityUtil.getCurrentUserPrincipal(), "BOARDING_CREATED", "BoardingAttendance", attendance.getId().toString(), null, "SUCCESS", "Boarding logged for student " + (student.getUser() != null ? student.getUser().getName() : ""));

        // Step 6: Trigger Parent Notification automatically
        Parent parent = student.getParent();
        if (parent != null) {
            String timeFormatted = now.format(DateTimeFormatter.ofPattern("hh:mm a"));
            String studentName = student.getUser() != null ? student.getUser().getName() : "Student";
            String message = String.format(
                    "BUS-LINK Alert: Your child %s has successfully boarded college bus %s at %s.",
                    studentName,
                    bus.getBusNumber(),
                    timeFormatted
            );
            try {
                notificationService.createNotification(parent, student, message, NotificationType.BOARDING);
            } catch (Exception ex) {
                org.slf4j.LoggerFactory.getLogger(BoardingService.class)
                        .error("Failed to deliver parent notification for student ID {}: {}", student.getId(), ex.getMessage());
            }
        }

        return attendance;
    }

    public List<BoardingAttendance> getStudentAttendanceHistory(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        validateStudentOrParentAccess(student);
        return boardingRepository.findByStudentId(studentId);
    }

    public void validateStudentOrParentAccess(Student student) {
        if (SecurityUtil.isAdmin() || SecurityUtil.hasRole("DRIVER")) return;

        String currentEmail = SecurityUtil.getCurrentUserEmail();

        if (student.getUser() != null && student.getUser().getEmail().equalsIgnoreCase(currentEmail)) {
            return;
        }
        if (student.getParent() != null && student.getParent().getUser() != null &&
                student.getParent().getUser().getEmail().equalsIgnoreCase(currentEmail)) {
            return;
        }

        throw new UnauthorizedAccessException("Access Denied: You cannot view another student's boarding history.");
    }

    public List<BoardingAttendance> getTripAttendance(Long tripId) {
        return boardingRepository.findByTripId(tripId);
    }

    public List<BoardingAttendance> getTodayBusAttendance(Long busId) {
        return boardingRepository.findByBusIdAndDate(busId, LocalDate.now());
    }

    public List<BoardingAttendance> getAllAttendance() {
        return boardingRepository.findAll();
    }

    private static final String QR_SECRET = "BUS_LINK_CRYPTO_SECURE_QR_KEY_2026";

    public String generateSignedQrToken(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));
        validateStudentOrParentAccess(student);

        long timestamp = System.currentTimeMillis();
        String payload = studentId + ":" + timestamp;
        String signature = hmacSha256(payload, QR_SECRET);
        return "STU-" + studentId + "-" + timestamp + "-" + signature;
    }

    public StudentQrPassResponse generateStudentQrPass(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));
        validateStudentOrParentAccess(student);

        String qrToken = generateSignedQrToken(studentId);
        String qrDataUrl = qrCodeGeneratorService.generateQrCodeDataUrl(qrToken, 300, 300);

        String busNumber = (student.getBus() != null) ? student.getBus().getBusNumber() : "Not Assigned";
        String routeName = (student.getBus() != null && student.getBus().getRoute() != null)
                ? student.getBus().getRoute().getRouteName()
                : "Standard Campus Route";
        String studentName = (student.getUser() != null) ? student.getUser().getName() : "Student";

        return new StudentQrPassResponse(
                qrToken,
                qrDataUrl,
                student.getId(),
                studentName,
                student.getStudentIdCode(),
                student.getCollegeName(),
                busNumber,
                routeName,
                120,
                LocalDateTime.now()
        );
    }

    @Transactional
    public BoardingAttendance recordDriverScan(DriverScanRequest scanRequest) {
        if (scanRequest == null || scanRequest.getQrToken() == null || scanRequest.getQrToken().isBlank()) {
            throw new BadRequestException("Scan rejected: Missing QR Code payload.");
        }
        Long targetBusId = scanRequest.getBusId() != null ? scanRequest.getBusId() : 1L;
        String location = (scanRequest.getLocation() != null && !scanRequest.getLocation().isBlank())
                ? scanRequest.getLocation()
                : "Driver Camera QR Scan";
        return recordQrBoarding(scanRequest.getQrToken(), targetBusId, location);
    }

    @Transactional
    public BoardingAttendance recordQrBoarding(String qrToken, Long busId, String location) {
        if (qrToken == null || !qrToken.startsWith("STU-")) {
            throw new BadRequestException("Invalid QR Code format");
        }

        String[] parts = qrToken.split("-");
        if (parts.length < 4) {
            throw new BadRequestException("Corrupted QR Token structure");
        }

        Long studentId;
        long timestamp;
        String providedSignature;
        try {
            studentId = Long.parseLong(parts[1]);
            timestamp = Long.parseLong(parts[2]);
            providedSignature = parts[3];
        } catch (NumberFormatException e) {
            throw new BadRequestException("Invalid data types in QR Token");
        }

        // Anti-QR Fraud Check 1: Expiration check (120s max age)
        long ageMs = System.currentTimeMillis() - timestamp;
        if (ageMs > 120000 || ageMs < -5000) {
            auditLogService.logUserAction(SecurityUtil.getCurrentUserPrincipal(), "QR_REPLAY_EXPIRED", "Student", studentId.toString(), null, "DENIED", "Expired or replayed QR token used");
            throw new BadRequestException("QR Code Expired: Please refresh student QR screen and scan again.");
        }

        // Anti-QR Fraud Check 2: HMAC Cryptographic Signature Check
        String expectedPayload = studentId + ":" + timestamp;
        String expectedSignature = hmacSha256(expectedPayload, QR_SECRET);
        if (!expectedSignature.equals(providedSignature)) {
            auditLogService.logUserAction(SecurityUtil.getCurrentUserPrincipal(), "QR_TAMPERED", "Student", studentId.toString(), null, "DENIED", "Tampered or forged QR signature");
            throw new BadRequestException("Fraudulent QR Token Detected: Cryptographic signature mismatch.");
        }

        // Lookup student and check bus assignment
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        Bus studentBus = student.getBus();
        if (studentBus == null) {
            throw new BadRequestException("Student " + (student.getUser() != null ? student.getUser().getName() : "") + " is not assigned to any bus. Contact administrator.");
        }

        // Validate Driver's Bus Assignment
        if (SecurityUtil.hasRole("DRIVER") && !SecurityUtil.isAdmin()) {
            String currentEmail = SecurityUtil.getCurrentUserEmail();
            Bus driverBus = busRepository.findByDriverUserEmail(currentEmail)
                    .orElseThrow(() -> new UnauthorizedAccessException("Access Denied: You are not assigned to any active bus."));

            if (!studentBus.getId().equals(driverBus.getId())) {
                auditLogService.logUserAction(SecurityUtil.getCurrentUserPrincipal(), "BOARDING_BUS_MISMATCH", "Student", studentId.toString(), null, "DENIED", "Student bus does not match driver bus");
                throw new BadRequestException("Bus Assignment Mismatch: Student is assigned to bus " + studentBus.getBusNumber() + ", but you operate bus " + driverBus.getBusNumber() + ".");
            }
        }

        // Execute verified boarding
        BoardingRequest request = new BoardingRequest();
        request.setBusId(studentBus.getId());
        request.setLocation(location != null ? location : "Driver Station QR Scan");
        return recordBoarding(studentId, request);
    }

    private String hmacSha256(String data, String key) {
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            javax.crypto.spec.SecretKeySpec secretKey = new javax.crypto.spec.SecretKeySpec(key.getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] hash = mac.doFinal(data.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error computing HMAC signature", e);
        }
    }
}
