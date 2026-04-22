package com.example.project.controller;

import com.example.project.dto.CommentDTO;
import com.example.project.model.Comment;
import com.example.project.model.Skill;
import com.example.project.model.Users;
import com.example.project.service.CommentRepository;
import com.example.project.service.SkillRepository;
import com.example.project.service.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/comments")
//@CrossOrigin
public class CommentController {

    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;

    @Autowired
    public CommentController(CommentRepository commentRepository,
                             UserRepository userRepository,
                             SkillRepository skillRepository) {
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.skillRepository = skillRepository;
    }

    @GetMapping("/all")
    public ResponseEntity<List<CommentDTO>> getAllComments() {
        List<CommentDTO> dtos = commentRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return new ResponseEntity<>(dtos, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CommentDTO> getComment(@PathVariable Long id) {
        return commentRepository.findById(id)
                .map(c -> new ResponseEntity<>(toDTO(c), HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }


    @GetMapping("/skill/{skillId}")
    public ResponseEntity<List<CommentDTO>> getCommentsBySkill(@PathVariable Long skillId) {
        List<CommentDTO> dtos = commentRepository.findBySkillSkillId(skillId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return new ResponseEntity<>(dtos, HttpStatus.OK);
    }


    @GetMapping("/user/{userId}")
    public ResponseEntity<List<CommentDTO>> getCommentsByUser(@PathVariable Long userId) {
        List<CommentDTO> dtos = commentRepository.findByUserUserId(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return new ResponseEntity<>(dtos, HttpStatus.OK);
    }


    @PostMapping("/add")
    public ResponseEntity<CommentDTO> addComment(@RequestBody CommentDTO dto) {
        Users user = userRepository.findById(dto.getUserId()).orElse(null);
        Skill skill = skillRepository.findById(dto.getSkillId()).orElse(null);

        if (user == null || skill == null)
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);

        Comment comment = new Comment();
        comment.setUser(user);
        comment.setSkill(skill);
        comment.setContent(dto.getContent());
        comment.setCreatedAt(LocalDate.now());

        Comment saved = commentRepository.save(comment);
        return new ResponseEntity<>(toDTO(saved), HttpStatus.CREATED);
    }


    @PutMapping("/{id}")
    public ResponseEntity<CommentDTO> updateComment(@PathVariable Long id, @RequestBody CommentDTO dto) {
        return commentRepository.findById(id).map(existing -> {
            existing.setContent(dto.getContent());
            Comment updated = commentRepository.save(existing);
            return new ResponseEntity<>(toDTO(updated), HttpStatus.OK);
        }).orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id) {
        return commentRepository.findById(id).map(c -> {
            commentRepository.delete(c);
            return new ResponseEntity<Void>(HttpStatus.NO_CONTENT);
        }).orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }


    private CommentDTO toDTO(Comment comment) {
        CommentDTO dto = new CommentDTO();
        dto.setCommentId(comment.getCommentId());
        dto.setUserId((long) comment.getUser().getUserId());
        dto.setSkillId((long) comment.getSkill().getSkillId());
        dto.setContent(comment.getContent());
        dto.setCreatedAt(comment.getCreatedAt());
        dto.setUsername(comment.getUser().getUsername());
        return dto;
    }
}
