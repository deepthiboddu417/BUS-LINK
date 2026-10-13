package com.buslink.controller;

import com.buslink.dto.ApiResponse;
import com.buslink.dto.BoardingRequest;
import com.buslink.entity.BoardingAttendance;
import com.buslink.service.BoardingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/boarding")
public class BoardingController {

    @Autowired
    private BoardingService boardingService;

    @PostMapping({"", "/"})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BoardingAttendance>> recordBoarding(@RequestParam(required = false) Long studentId,
                                                                           @RequestBody(required = false) BoardingRequest request) {
        Long targetStudentId = (studentId != null) ? studentId : 1L;
        BoardingRequest req = (request != null) ? request : new BoardingRequest();
        BoardingAttendance attendance = boardingService.recordBoarding(targetStudentId, req);
        return ResponseEntity.ok(new ApiResponse<>(true, "✓ Boarding Confirmed", attendance));
    }

    @PostMapping("/student/{studentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BoardingAttendance>> recordBoardingForStudent(@PathVariable Long studentId,
                                                                                     @RequestBody(required = false) BoardingRequest request) {
        BoardingRequest req = (request != null) ? request : new BoardingRequest();
        BoardingAttendance attendance = boardingService.recordBoarding(studentId, req);
        return ResponseEntity.ok(new ApiResponse<>(true, "✓ Boarding Confirmed", attendance));
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT', 'PARENT', 'DRIVER')")
    public ResponseEntity<ApiResponse<List<BoardingAttendance>>> getStudentHistory(@PathVariable Long studentId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Boarding history retrieved", boardingService.getStudentAttendanceHistory(studentId)));
    }

    @GetMapping("/trip/{tripId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER')")
    public ResponseEntity<ApiResponse<List<BoardingAttendance>>> getTripAttendance(@PathVariable Long tripId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Trip attendance retrieved", boardingService.getTripAttendance(tripId)));
    }

    @GetMapping("/bus/{busId}/today")
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER', 'PARENT')")
    public ResponseEntity<ApiResponse<List<BoardingAttendance>>> getTodayBusAttendance(@PathVariable Long busId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Today's bus attendance retrieved", boardingService.getTodayBusAttendance(busId)));
    }

    @GetMapping("/student/{studentId}/qr-token")
    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT', 'PARENT', 'DRIVER')")
    public ResponseEntity<ApiResponse<String>> getStudentQrToken(@PathVariable Long studentId) {
        String token = boardingService.generateSignedQrToken(studentId);
        return ResponseEntity.ok(new ApiResponse<>(true, "QR Token generated", token));
    }

    @GetMapping("/student/{studentId}/qr-pass")
    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT', 'PARENT', 'DRIVER')")
    public ResponseEntity<ApiResponse<com.buslink.dto.StudentQrPassResponse>> getStudentQrPass(@PathVariable Long studentId) {
        com.buslink.dto.StudentQrPassResponse pass = boardingService.generateStudentQrPass(studentId);
        return ResponseEntity.ok(new ApiResponse<>(true, "ZXing QR Pass generated successfully", pass));
    }

    @PostMapping("/scan-qr")
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER')")
    public ResponseEntity<ApiResponse<BoardingAttendance>> scanQrCode(@RequestBody java.util.Map<String, Object> body) {
        String qrToken = (String) body.get("qrToken");
        Long busId = body.get("busId") != null ? Long.parseLong(body.get("busId").toString()) : 1L;
        String location = (String) body.get("location");
        BoardingAttendance attendance = boardingService.recordQrBoarding(qrToken, busId, location);
        return ResponseEntity.ok(new ApiResponse<>(true, "✓ QR Boarding Verified & Confirmed", attendance));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<BoardingAttendance>>> getAllAttendance() {
        return ResponseEntity.ok(new ApiResponse<>(true, "All attendance records retrieved", boardingService.getAllAttendance()));
    }
}
