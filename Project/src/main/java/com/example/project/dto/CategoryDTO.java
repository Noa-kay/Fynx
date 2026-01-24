package com.example.project.dto;

import com.example.project.model.Skill;
import java.util.List;
import java.util.ArrayList;

public class CategoryDTO {
    private Long categoryId;
    private String categoryName;
    private String description;
    private List<Skill> skills = new ArrayList<>();

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public List<Skill> getSkills() { return skills; }
    public void setSkills(List<Skill> skills) { this.skills = skills; }
}
