package com.example.project.service;

import com.example.project.dto.SkillDTO;
import com.example.project.dto.CommentDTO;
import com.example.project.model.Skill;
import com.example.project.model.Comment;
import org.mapstruct.Mapper;

import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface SkillMapper {

    List<SkillDTO> skillsToDto(List<Skill> skills);

    Skill skillDTOtoSkill(SkillDTO d);

    default SkillDTO skillToDto(Skill s) {
        if (s == null) return null;

        SkillDTO dto = new SkillDTO();
        dto.setSkillId(s.getSkillId());
        dto.setTitle(s.getTitle());
        dto.setDescription(s.getDescription());
        dto.setCreatedAt(s.getCreatedAt());
        dto.setLikesCount(s.getLikesCount());

        // 1. נתוני משתמש
        if (s.getUser() != null) {
            dto.setUserId(s.getUser().getUserId());
            dto.setUsername(s.getUser().getUsername());
            // וודא שאתה ממפה את שדה האווטאר אם קיים
             dto.setUserAvatarUrl(s.getUser().getAvatarUrl());
        }

        // 2. נתוני קטגוריה
        if (s.getCategory() != null) {
            dto.setCategoryId(s.getCategory().getCategoryId());
            dto.setCategoryName(s.getCategory().getCategoryName());
        }

        // 3. רשימת תגובות (המרה ל-DTOs)
        if (s.getComments() != null) {
            dto.setComments(s.getComments().stream()
                    .map(this::commentEntityToDto)
                    .collect(Collectors.toList()));
        }

        // 4. נתיב התמונה (התיקון לשגיאה!)
        dto.setImagePath(s.getImagePath());

        return dto;
    }

    // שימו לב: זו פונקציה דרושה להשלמת המיפוי של התגובות
    default CommentDTO commentEntityToDto(Comment comment) {
        CommentDTO dto = new CommentDTO();
        if (comment == null) return dto;

        dto.setCommentId(comment.getCommentId());
        dto.setContent(comment.getContent());
        dto.setCreatedAt(comment.getCreatedAt());
        // נניח ש-CommentDTO מכיל רק את שם המשתמש
        dto.setUsername(comment.getUser() != null ? comment.getUser().getUsername() : null);
        return dto;
    }
}