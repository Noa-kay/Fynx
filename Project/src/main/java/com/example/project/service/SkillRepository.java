package com.example.project.service;

import com.example.project.model.Skill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SkillRepository extends JpaRepository<Skill,Long> {

    // כל ה-Skills של משתמש מסוים
    List<Skill> findByUserUserId(Long userId);

    // כל ה-Skills בקטגוריה מסוימת
    List<Skill> findByCategoryCategoryId(Long categoryId);

    // Skill לפי title
    Skill findByTitle(String title);



}
