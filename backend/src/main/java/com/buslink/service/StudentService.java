package com.buslink.service;

import com.buslink.entity.Bus;
import com.buslink.entity.Parent;
import com.buslink.entity.Student;
import com.buslink.exception.ResourceNotFoundException;
import com.buslink.exception.UnauthorizedAccessException;
import com.buslink.repository.BusRepository;
import com.buslink.repository.ParentRepository;
import com.buslink.repository.StudentRepository;
import com.buslink.security.SecurityUtil;
import com.buslink.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StudentService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private BusRepository busRepository;

    @Autowired
    private ParentRepository parentRepository;

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public Student getStudentById(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));

        validateStudentAccess(student);
        return student;
    }

    public Student getStudentByEmail(String email) {
        Student student = studentRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with email: " + email));

        validateStudentAccess(student);
        return student;
    }

    public void validateStudentAccess(Student student) {
        UserPrincipal currentUser = SecurityUtil.getCurrentUserPrincipal();
        if (currentUser == null || SecurityUtil.isAdmin()) {
            return; // Admin or internal system call allowed
        }

        String email = currentUser.getUsername();

        // 1. If user is student, must be accessing their own record
        if (student.getUser() != null && student.getUser().getEmail().equalsIgnoreCase(email)) {
            return;
        }

        // 2. If user is parent, student must be linked to this parent
        if (student.getParent() != null && student.getParent().getUser() != null &&
                student.getParent().getUser().getEmail().equalsIgnoreCase(email)) {
            return;
        }

        // 3. Driver assigned to student's bus is allowed
        if (SecurityUtil.hasRole("DRIVER") && student.getBus() != null && student.getBus().getDriver() != null &&
                student.getBus().getDriver().getUser() != null &&
                student.getBus().getDriver().getUser().getEmail().equalsIgnoreCase(email)) {
            return;
        }

        throw new UnauthorizedAccessException("Access Denied: You do not have permission to access student record #" + student.getId());
    }

    @Transactional
    public Student assignBus(Long studentId, Long busId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));
        Bus bus = busRepository.findById(busId)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + busId));

        if (bus.getCapacity() != null) {
            long currentCount = studentRepository.findAll().stream()
                    .filter(s -> s.getBus() != null && s.getBus().getId().equals(busId) && !s.getId().equals(studentId))
                    .count();
            if (currentCount >= bus.getCapacity()) {
                throw new com.buslink.exception.BadRequestException(
                        "Cannot assign student: Bus " + bus.getBusNumber() + " has reached max capacity (" + bus.getCapacity() + " seats)."
                );
            }
        }

        student.setBus(bus);
        return studentRepository.save(student);
    }

    @Transactional
    public Student linkParent(Long studentId, Long parentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));
        Parent parent = parentRepository.findById(parentId)
                .orElseThrow(() -> new ResourceNotFoundException("Parent not found with id: " + parentId));
        student.setParent(parent);
        return studentRepository.save(student);
    }

    @Transactional
    public Student updateStudent(Long id, Student updated) {
        Student existing = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));
        validateStudentAccess(existing);

        existing.setCollegeName(updated.getCollegeName());
        existing.setStudentIdCode(updated.getStudentIdCode());
        if (updated.getUser() != null) {
            existing.getUser().setName(updated.getUser().getName());
            existing.getUser().setPhone(updated.getUser().getPhone());
        }
        return studentRepository.save(existing);
    }

    @Transactional
    public void deleteStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));
        studentRepository.delete(student);
    }
}
