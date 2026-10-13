package com.buslink.controller;

import com.buslink.dto.ApiResponse;
import com.buslink.entity.Notification;
import com.buslink.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping("/parent/{parentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PARENT')")
    public ResponseEntity<ApiResponse<List<Notification>>> getParentNotifications(@PathVariable Long parentId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Notifications retrieved", notificationService.getNotificationsForParent(parentId)));
    }

    @GetMapping("/parent/{parentId}/unread")
    @PreAuthorize("hasAnyRole('ADMIN', 'PARENT')")
    public ResponseEntity<ApiResponse<List<Notification>>> getUnreadParentNotifications(@PathVariable Long parentId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Unread notifications retrieved", notificationService.getUnreadNotificationsForParent(parentId)));
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('ADMIN', 'PARENT')")
    public ResponseEntity<ApiResponse<Notification>> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Notification marked as read", notificationService.markAsRead(id)));
    }

    @PutMapping("/parent/{parentId}/read-all")
    @PreAuthorize("hasAnyRole('ADMIN', 'PARENT')")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(@PathVariable Long parentId) {
        notificationService.markAllAsRead(parentId);
        return ResponseEntity.ok(new ApiResponse<>(true, "All notifications marked as read"));
    }
}
