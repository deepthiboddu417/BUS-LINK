package com.buslink.service;

import com.buslink.entity.BoardingAttendance;
import com.buslink.entity.Parent;
import com.buslink.entity.Student;
import com.buslink.exception.ResourceNotFoundException;
import com.buslink.exception.UnauthorizedAccessException;
import com.buslink.repository.BoardingAttendanceRepository;
import com.buslink.repository.ParentRepository;
import com.buslink.repository.StudentRepository;
import com.buslink.security.SecurityUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ParentService {

    @Autowired
    private ParentRepository parentRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private BoardingAttendanceRepository boardingAttendanceRepository;

    public List<Parent> getAllParents() {
        return parentRepository.findAll();
    }

    public Parent getParentById(Long id) {
        Parent parent = parentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parent not found with id: " + id));

        validateParentOwnership(parent);
        return parent;
    }

    public Parent getParentByEmail(String email) {
        Parent parent = parentRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Parent not found with email: " + email));

        validateParentOwnership(parent);
        return parent;
    }

    public List<Student> getChildrenOfParent(Long parentId) {
        Parent parent = parentRepository.findById(parentId)
                .orElseThrow(() -> new ResourceNotFoundException("Parent not found with id: " + parentId));

        validateParentOwnership(parent);
        return studentRepository.findByParentId(parentId);
    }

    public List<BoardingAttendance> getChildBoardingHistory(Long parentId, Long childId) {
        Parent parent = getParentById(parentId);
        Student student = studentRepository.findById(childId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + childId));

        // Strict relationship validation: child MUST belong to parent
        if (student.getParent() == null || !student.getParent().getId().equals(parent.getId())) {
            throw new UnauthorizedAccessException("Access Denied: Parent #" + parentId + " does not have access to student #" + childId);
        }

        return boardingAttendanceRepository.findByStudentId(childId);
    }

    public void validateParentOwnership(Parent parent) {
        if (SecurityUtil.isAdmin()) {
            return; // Admin allowed
        }
        String currentEmail = SecurityUtil.getCurrentUserEmail();
        if (parent.getUser() == null || !parent.getUser().getEmail().equalsIgnoreCase(currentEmail)) {
            throw new UnauthorizedAccessException("Access Denied: You cannot access another parent's account or children");
        }
    }

    @Transactional
    public Parent updateParent(Long id, Parent updated) {
        Parent existing = getParentById(id);
        existing.setAddress(updated.getAddress());
        if (updated.getUser() != null) {
            existing.getUser().setName(updated.getUser().getName());
            existing.getUser().setPhone(updated.getUser().getPhone());
        }
        return parentRepository.save(existing);
    }

    @Transactional
    public void deleteParent(Long id) {
        Parent parent = getParentById(id);
        parentRepository.delete(parent);
    }
}
