package com.example.project.service;

import com.example.project.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByUserUserId(Long userId);
    List<Comment> findBySkillSkillId(Long skillId);
    List<Comment> findBySkill_SkillId(Long skillId);
}

