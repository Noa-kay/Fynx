package com.example.project.service;

import com.example.project.model.Category;
import com.example.project.model.Skill;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category,Long> {


}
