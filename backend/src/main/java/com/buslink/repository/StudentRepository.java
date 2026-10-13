package com.buslink.repository;

import com.buslink.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByUserEmail(String email);
    Optional<Student> findByStudentIdCode(String studentIdCode);
    boolean existsByStudentIdCode(String studentIdCode);
    List<Student> findByParentId(Long parentId);
    List<Student> findByBusId(Long busId);
}
