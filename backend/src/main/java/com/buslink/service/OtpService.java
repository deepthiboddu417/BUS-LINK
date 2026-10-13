package com.buslink.service;

import com.buslink.entity.OtpVerification;
import com.buslink.entity.User;
import com.buslink.exception.BadRequestException;
import com.buslink.repository.OtpVerificationRepository;
import com.buslink.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class OtpService {

    @Autowired
    private OtpVerificationRepository otpRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuditLogService auditLogService;

    private static final SecureRandom random = new SecureRandom();

    @Transactional
    public String generateAndSendOtp(String email, String clientIp) {
        String code = String.format("%06d", random.nextInt(1000000));
        String hashedCode = passwordEncoder.encode(code);

        OtpVerification otp = new OtpVerification(email, hashedCode, LocalDateTime.now().plusMinutes(5));
        otpRepository.save(otp);

        System.out.println("=========================================");
        System.out.println("🔐 MOCK DEV OTP GENERATED FOR: " + email);
        System.out.println("👉 OTP CODE: " + code + " (Expires in 5 minutes)");
        System.out.println("=========================================");

        auditLogService.logAction(null, email, "ANONYMOUS", "OTP_GENERATED", "OtpVerification", null, clientIp, "SUCCESS", "OTP code generated and dispatched");
        return code;
    }

    @Transactional
    public boolean verifyOtp(String email, String rawCode, String clientIp) {
        OtpVerification otp = otpRepository.findTopByEmailAndIsUsedFalseOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new BadRequestException("No active OTP request found for " + email));

        if (otp.getExpiryTime().isBefore(LocalDateTime.now())) {
            auditLogService.logAction(null, email, "ANONYMOUS", "OTP_EXPIRED", "OtpVerification", otp.getId().toString(), clientIp, "FAILURE", "Expired OTP attempt");
            throw new BadRequestException("OTP code has expired. Please request a new code.");
        }

        if (otp.getAttempts() >= 3) {
            otp.setIsUsed(true);
            otpRepository.save(otp);
            auditLogService.logAction(null, email, "ANONYMOUS", "OTP_EXCEEDED_ATTEMPTS", "OtpVerification", otp.getId().toString(), clientIp, "FAILURE", "Exceeded 3 invalid OTP attempts");
            throw new BadRequestException("Too many failed attempts. OTP invalidated.");
        }

        if (!passwordEncoder.matches(rawCode, otp.getOtpHash())) {
            otp.setAttempts(otp.getAttempts() + 1);
            otpRepository.save(otp);
            auditLogService.logAction(null, email, "ANONYMOUS", "OTP_INVALID", "OtpVerification", otp.getId().toString(), clientIp, "FAILURE", "Invalid OTP code entered");
            throw new BadRequestException("Invalid OTP code");
        }

        otp.setIsUsed(true);
        otpRepository.save(otp);

        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            user.setIsVerified(true);
            userRepository.save(user);
        }

        auditLogService.logAction(user != null ? user.getId() : null, email, user != null ? user.getRole().name() : "ANONYMOUS", "OTP_VERIFIED_SUCCESS", "User", email, clientIp, "SUCCESS", "Email successfully verified via OTP");
        return true;
    }
}
