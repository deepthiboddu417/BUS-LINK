package com.buslink.repository;

import com.buslink.entity.Parent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ParentRepository extends JpaRepository<Parent, Long> {
    Optional<Parent> findByUserEmail(String email);
    Optional<Parent> findByUserId(Long userId);
}
