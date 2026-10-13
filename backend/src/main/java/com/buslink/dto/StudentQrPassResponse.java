package com.buslink.dto;

import java.time.LocalDateTime;

public class StudentQrPassResponse {
    private String qrToken;
    private String qrCodeDataUrl;
    private Long studentId;
    private String studentName;
    private String studentIdCode;
    private String college;
    private String busNumber;
    private String routeName;
    private int expiresInSeconds;
    private LocalDateTime generatedAt;

    public StudentQrPassResponse() {}

    public StudentQrPassResponse(String qrToken, String qrCodeDataUrl, Long studentId, String studentName,
                                String studentIdCode, String college, String busNumber, String routeName,
                                int expiresInSeconds, LocalDateTime generatedAt) {
        this.qrToken = qrToken;
        this.qrCodeDataUrl = qrCodeDataUrl;
        this.studentId = studentId;
        this.studentName = studentName;
        this.studentIdCode = studentIdCode;
        this.college = college;
        this.busNumber = busNumber;
        this.routeName = routeName;
        this.expiresInSeconds = expiresInSeconds;
        this.generatedAt = generatedAt;
    }

    public String getQrToken() {
        return qrToken;
    }

    public void setQrToken(String qrToken) {
        this.qrToken = qrToken;
    }

    public String getQrCodeDataUrl() {
        return qrCodeDataUrl;
    }

    public void setQrCodeDataUrl(String qrCodeDataUrl) {
        this.qrCodeDataUrl = qrCodeDataUrl;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getStudentIdCode() {
        return studentIdCode;
    }

    public void setStudentIdCode(String studentIdCode) {
        this.studentIdCode = studentIdCode;
    }

    public String getCollege() {
        return college;
    }

    public void setCollege(String college) {
        this.college = college;
    }

    public String getBusNumber() {
        return busNumber;
    }

    public void setBusNumber(String busNumber) {
        this.busNumber = busNumber;
    }

    public String getRouteName() {
        return routeName;
    }

    public void setRouteName(String routeName) {
        this.routeName = routeName;
    }

    public int getExpiresInSeconds() {
        return expiresInSeconds;
    }

    public void setExpiresInSeconds(int expiresInSeconds) {
        this.expiresInSeconds = expiresInSeconds;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }
}
