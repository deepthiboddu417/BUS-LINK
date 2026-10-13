package com.buslink.controller;

import com.buslink.dto.ApiResponse;
import com.buslink.entity.Student;
import com.buslink.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    @Autowired
    private StudentService studentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER')")
    public ResponseEntity<ApiResponse<List<Student>>> getAllStudents() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Students retrieved", studentService.getAllStudents()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT', 'PARENT', 'DRIVER')")
    public ResponseEntity<ApiResponse<Student>> getStudentById(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Student details retrieved", studentService.getStudentById(id)));
    }

    @GetMapping("/email/{email}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT', 'PARENT', 'DRIVER')")
    public ResponseEntity<ApiResponse<Student>> getStudentByEmail(@PathVariable String email) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Student details retrieved", studentService.getStudentByEmail(email)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Student>> updateStudent(@PathVariable Long id, @RequestBody Student student) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Student updated", studentService.updateStudent(id, student)));
    }

    @PutMapping("/{id}/assign-bus/{busId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Student>> assignBus(@PathVariable Long id, @PathVariable Long busId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Bus assigned successfully", studentService.assignBus(id, busId)));
    }

    @PutMapping("/{id}/link-parent/{parentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Student>> linkParent(@PathVariable Long id, @PathVariable Long parentId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Parent linked successfully", studentService.linkParent(id, parentId)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteStudent(@PathVariable Long id) {
        studentService.deleteStudent(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Student deleted successfully"));
    }
}
