package com.buslink.service;

import com.buslink.entity.Notification;
import com.buslink.entity.NotificationType;
import com.buslink.entity.Parent;
import com.buslink.entity.Student;
import com.buslink.exception.ResourceNotFoundException;
import com.buslink.exception.UnauthorizedAccessException;
import com.buslink.repository.NotificationRepository;
import com.buslink.repository.ParentRepository;
import com.buslink.security.SecurityUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ParentRepository parentRepository;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    @Transactional
    public Notification createNotification(Parent parent, Student student, String message, NotificationType type) {
        Notification notification = new Notification(parent, student, message, type);
        notification = notificationRepository.save(notification);

        if (messagingTemplate != null) {
            try {
                messagingTemplate.convertAndSend("/topic/parent/" + parent.getId() + "/notifications", notification);
            } catch (Exception ignored) {}
        }

        return notification;
    }

    @Transactional
    public void createSystemNotification(NotificationType type, String message) {
        List<Parent> parents = parentRepository.findAll();
        for (Parent p : parents) {
            createNotification(p, null, message, type);
        }
    }

    public List<Notification> getNotificationsForParent(Long parentId) {
        validateParentOwnership(parentId);
        return notificationRepository.findByParentIdOrderByCreatedAtDesc(parentId);
    }

    public List<Notification> getUnreadNotificationsForParent(Long parentId) {
        validateParentOwnership(parentId);
        return notificationRepository.findByParentIdAndIsReadFalseOrderByCreatedAtDesc(parentId);
    }

    private void validateParentOwnership(Long parentId) {
        if (SecurityUtil.isAdmin()) return;

        Parent parent = parentRepository.findById(parentId)
                .orElseThrow(() -> new ResourceNotFoundException("Parent not found with id: " + parentId));

        String currentEmail = SecurityUtil.getCurrentUserEmail();
        if (parent.getUser() == null || !parent.getUser().getEmail().equalsIgnoreCase(currentEmail)) {
            throw new UnauthorizedAccessException("Access Denied: You cannot view notifications for another parent.");
        }
    }

    @Transactional
    public Notification markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));
        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(Long parentId) {
        validateParentOwnership(parentId);
        List<Notification> unread = notificationRepository.findByParentIdAndIsReadFalseOrderByCreatedAtDesc(parentId);
        for (Notification n : unread) {
            n.setIsRead(true);
        }
        notificationRepository.saveAll(unread);
    }
}
