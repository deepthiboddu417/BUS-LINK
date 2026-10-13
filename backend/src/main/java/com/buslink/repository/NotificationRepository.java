package com.buslink.repository;

import com.buslink.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByParentIdOrderByCreatedAtDesc(Long parentId);
    List<Notification> findByParentIdAndIsReadFalseOrderByCreatedAtDesc(Long parentId);
    List<Notification> findByStudentIdOrderByCreatedAtDesc(Long studentId);
}
