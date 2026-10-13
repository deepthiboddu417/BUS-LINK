package com.buslink.controller;

import com.buslink.dto.ApiResponse;
import com.buslink.entity.BoardingAttendance;
import com.buslink.entity.Parent;
import com.buslink.entity.Student;
import com.buslink.service.ParentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parents")
public class ParentController {

    @Autowired
    private ParentService parentService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Parent>>> getAllParents() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Parents retrieved", parentService.getAllParents()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PARENT')")
    public ResponseEntity<ApiResponse<Parent>> getParentById(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Parent retrieved", parentService.getParentById(id)));
    }

    @GetMapping("/email/{email}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PARENT')")
    public ResponseEntity<ApiResponse<Parent>> getParentByEmail(@PathVariable String email) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Parent retrieved", parentService.getParentByEmail(email)));
    }

    @GetMapping("/{id}/children")
    @PreAuthorize("hasAnyRole('ADMIN', 'PARENT')")
    public ResponseEntity<ApiResponse<List<Student>>> getChildren(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Children retrieved", parentService.getChildrenOfParent(id)));
    }

    @GetMapping("/{id}/children/{childId}/boarding-history")
    @PreAuthorize("hasAnyRole('ADMIN', 'PARENT')")
    public ResponseEntity<ApiResponse<List<BoardingAttendance>>> getChildBoardingHistory(
            @PathVariable Long id,
            @PathVariable Long childId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Child boarding history retrieved", parentService.getChildBoardingHistory(id, childId)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PARENT')")
    public ResponseEntity<ApiResponse<Parent>> updateParent(@PathVariable Long id, @RequestBody Parent parent) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Parent updated", parentService.updateParent(id, parent)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteParent(@PathVariable Long id) {
        parentService.deleteParent(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Parent deleted"));
    }
}
