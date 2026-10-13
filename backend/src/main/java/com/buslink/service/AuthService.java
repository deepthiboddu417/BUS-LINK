package com.buslink.service;

import com.buslink.dto.AuthRequest;
import com.buslink.dto.AuthResponse;
import com.buslink.dto.RegisterRequest;
import com.buslink.dto.TokenRefreshRequest;
import com.buslink.dto.TokenRefreshResponse;
import com.buslink.entity.*;
import com.buslink.exception.BadRequestException;
import com.buslink.exception.ResourceAlreadyExistsException;
import com.buslink.exception.UnauthorizedAccessException;
import com.buslink.repository.*;
import com.buslink.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private ParentRepository parentRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private BusRepository busRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private BruteForceProtectionService bruteForceProtectionService;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private AuditLogService auditLogService;

    public AuthResponse login(AuthRequest request, String clientIp) {
        String emailKey = request.getEmail() != null ? request.getEmail().toLowerCase().trim() : "";

        if (bruteForceProtectionService.isBlocked(emailKey)) {
            auditLogService.logAction(null, emailKey, "ANONYMOUS", "LOGIN_ATTEMPT", "User", null, clientIp, "DENIED", "Account is locked due to repeated failed login attempts.");
            throw new UnauthorizedAccessException("Account is temporarily locked due to repeated failed login attempts. Please try again after 15 minutes.");
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String token = tokenProvider.generateToken(authentication);

            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new BadRequestException("Invalid credentials"));

            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

            bruteForceProtectionService.loginSucceeded(emailKey);
            auditLogService.logAction(user.getId(), user.getEmail(), user.getRole().name(), "LOGIN_SUCCESS", "User", user.getId().toString(), clientIp, "SUCCESS", "User authenticated successfully");

            AuthResponse response = new AuthResponse(token, refreshToken.getToken(), user.getId(), user.getName(), user.getEmail(), user.getRole());

            // Enrich with domain entity IDs
            if (user.getRole() == Role.ROLE_STUDENT) {
                studentRepository.findByUserEmail(user.getEmail()).ifPresent(student -> {
                    response.setStudentId(student.getId());
                    if (student.getBus() != null) response.setBusId(student.getBus().getId());
                    if (student.getParent() != null) response.setParentId(student.getParent().getId());
                });
            } else if (user.getRole() == Role.ROLE_PARENT) {
                parentRepository.findByUserEmail(user.getEmail()).ifPresent(parent -> {
                    response.setParentId(parent.getId());
                });
            } else if (user.getRole() == Role.ROLE_DRIVER) {
                driverRepository.findByUserEmail(user.getEmail()).ifPresent(driver -> {
                    response.setDriverId(driver.getId());
                    busRepository.findByDriverId(driver.getId()).ifPresent(bus -> {
                        response.setBusId(bus.getId());
                    });
                });
            }

            return response;

        } catch (BadCredentialsException ex) {
            User targetUser = userRepository.findByEmail(request.getEmail()).orElse(null);
            Long userId = targetUser != null ? targetUser.getId() : null;
            bruteForceProtectionService.loginFailed(emailKey, clientIp, userId);
            auditLogService.logAction(userId, emailKey, "ANONYMOUS", "LOGIN_FAILURE", "User", null, clientIp, "FAILURE", "Invalid password provided");
            throw new BadCredentialsException("Invalid email or password");
        }
    }

    @Transactional
    public AuthResponse register(RegisterRequest request, String clientIp) {
        if (request == null) {
            throw new BadRequestException("Registration request payload is required.");
        }
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new BadRequestException("Full Name is required.");
        }
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new BadRequestException("Email address is required.");
        }
        String cleanEmail = request.getEmail().trim().toLowerCase();
        if (!cleanEmail.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new BadRequestException("Invalid email format.");
        }
        if (request.getPassword() == null || request.getPassword().trim().length() < 6) {
            throw new BadRequestException("Password must be at least 6 characters long.");
        }
        if (request.getPhone() == null || request.getPhone().trim().isEmpty()) {
            throw new BadRequestException("Phone number is required.");
        }

        Role userRole = request.getRole() != null ? request.getRole() : Role.ROLE_STUDENT;
        if (userRole == Role.ROLE_ADMIN) {
            throw new BadRequestException("Registration for the ADMIN role is strictly prohibited. Admin accounts must be securely provisioned by system administrators.");
        }

        if (userRepository.existsByEmail(cleanEmail)) {
            throw new ResourceAlreadyExistsException("Conflict: Email address is already registered!");
        }

        if (userRole == Role.ROLE_STUDENT) {
            String studentIdCode = request.getStudentIdCode();
            if (studentIdCode != null && !studentIdCode.trim().isEmpty()) {
                if (studentRepository.existsByStudentIdCode(studentIdCode.trim())) {
                    throw new ResourceAlreadyExistsException("Conflict: Student ID Code '" + studentIdCode.trim() + "' is already registered!");
                }
            }
        }

        User user = new User(
                cleanEmail,
                passwordEncoder.encode(request.getPassword().trim()),
                request.getName().trim(),
                request.getPhone().trim(),
                userRole
        );

        user = userRepository.save(user);

        Long studentId = null;
        Long parentId = null;
        Long driverId = null;

        if (userRole == Role.ROLE_STUDENT) {
            Student student = new Student();
            student.setUser(user);
            student.setStudentIdCode(request.getStudentIdCode() != null && !request.getStudentIdCode().trim().isEmpty() ? request.getStudentIdCode().trim() : "STU" + user.getId());
            student.setCollegeName(request.getCollegeName() != null && !request.getCollegeName().trim().isEmpty() ? request.getCollegeName().trim() : "BUS-LINK College of Technology");
            
            busRepository.findAll().stream().findFirst().ifPresent(student::setBus);
            
            student = studentRepository.save(student);
            studentId = student.getId();
        } else if (userRole == Role.ROLE_PARENT) {
            Parent parent = new Parent(user, request.getAddress() != null ? request.getAddress().trim() : "");
            parent = parentRepository.save(parent);
            parentId = parent.getId();
        } else if (userRole == Role.ROLE_DRIVER) {
            Driver driver = new Driver(user, request.getLicenseNumber() != null && !request.getLicenseNumber().trim().isEmpty() ? request.getLicenseNumber().trim() : "LIC-" + user.getId());
            driver = driverRepository.save(driver);
            driverId = driver.getId();
        }

        String token = tokenProvider.generateTokenForUser(user.getEmail());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());
        auditLogService.logAction(user.getId(), user.getEmail(), user.getRole().name(), "REGISTER_SUCCESS", "User", user.getId().toString(), clientIp, "SUCCESS", "User registered successfully");

        AuthResponse response = new AuthResponse(token, refreshToken.getToken(), user.getId(), user.getName(), user.getEmail(), user.getRole());
        response.setStudentId(studentId);
        response.setParentId(parentId);
        response.setDriverId(driverId);
        if (userRole == Role.ROLE_STUDENT && studentId != null) {
            studentRepository.findById(studentId).ifPresent(st -> {
                if (st.getBus() != null) response.setBusId(st.getBus().getId());
            });
        }
        return response;
    }

    public TokenRefreshResponse refreshToken(TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();
        return refreshTokenService.verifyExpiration(
                refreshTokenService.createRefreshToken(
                        refreshTokenService.verifyExpiration(
                                refreshTokenRepository.findByToken(requestRefreshToken)
                                        .orElseThrow(() -> new BadRequestException("Refresh token is not in database!"))
                        ).getUser().getId()
                )
        ) != null ? new TokenRefreshResponse(
                tokenProvider.generateTokenForUser(
                        refreshTokenRepository.findByToken(requestRefreshToken).get().getUser().getEmail()
                ),
                requestRefreshToken
        ) : null;
    }

    public void logout(String refreshToken, String clientIp, Long userId, String email, String role) {
        if (refreshToken != null) {
            refreshTokenService.revokeRefreshToken(refreshToken);
        }
        if (userId != null) {
            refreshTokenService.deleteByUserId(userId);
        }
        auditLogService.logAction(userId, email, role, "LOGOUT", "User", userId != null ? userId.toString() : null, clientIp, "SUCCESS", "User logged out");
    }

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;
}
