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

        if (s.getUser() != null) {
            dto.setUserId(s.getUser().getUserId());
            dto.setUsername(s.getUser().getUsername());
            dto.setUserAvatarUrl(s.getUser().getAvatarUrl());
        }

        if (s.getCategory() != null) {
            dto.setCategoryId(s.getCategory().getCategoryId());
            dto.setCategoryName(s.getCategory().getCategoryName());
        }

        if (s.getComments() != null) {
            dto.setComments(s.getComments().stream()
                    .map(this::commentEntityToDto)
                    .collect(Collectors.toList()));
        }

        dto.setImagePath(s.getImagePath());

        return dto;
    }

    default CommentDTO commentEntityToDto(Comment comment) {
        CommentDTO dto = new CommentDTO();
        if (comment == null) return dto;

        dto.setCommentId(comment.getCommentId());
        dto.setContent(comment.getContent());
        dto.setCreatedAt(comment.getCreatedAt());
        dto.setUsername(comment.getUser() != null ? comment.getUser().getUsername() : null);
        return dto;
    }
}