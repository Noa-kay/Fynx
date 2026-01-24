package com.example.project.controller;

import com.example.project.dto.ChatRequest;
import com.example.project.dto.ChatResponse;
import com.example.project.dto.CommentDTO;
import com.example.project.dto.SkillDTO;
import com.example.project.model.Comment;
import com.example.project.model.Skill;
import com.example.project.model.Users;
import com.example.project.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.example.project.service.CommentRepository;


import javax.validation.Valid;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/skills")
@CrossOrigin(origins = "http://localhost:4200")
public class SkillController {

    private final SkillRepository skillRepository;
    private final SkillMapper skillMapper;
    private AIChatService aiChatService;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final CommentRepository commentRepository;

    @Autowired
    public SkillController(SkillRepository skillRepository, SkillMapper skillMapper , AIChatService aiChatService , UserRepository userRepository, CategoryRepository categoryRepository, CommentRepository  commentRepository ) {
        this.skillRepository = skillRepository;
        this.skillMapper = skillMapper;
        this.aiChatService = aiChatService;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.commentRepository=commentRepository;
    }


    @PostMapping(value = "/uploadSkill", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SkillDTO> uploadSkillWithImage(
            @RequestPart(value = "image", required = false) MultipartFile file,
            @RequestPart("skill") SkillDTO skillDTO) {

        try {
            Skill skill = skillMapper.skillDTOtoSkill(skillDTO);

            if (skillDTO.getUserId() != null) {
                userRepository.findById(skillDTO.getUserId()).ifPresent(skill::setUser);
            }

            if (skillDTO.getCategoryId() != null) {
                categoryRepository.findById(skillDTO.getCategoryId()).ifPresent(skill::setCategory);
            }

            if (file != null && !file.isEmpty()) {
                String safeFileName = ImageUtils.uploadImage(file);
                skill.setImagePath(safeFileName);
            } else {
                skill.setImagePath(null);
            }

            Skill savedSkill = skillRepository.save(skill);
            SkillDTO responseDTO = skillMapper.skillToDto(savedSkill);

            return new ResponseEntity<>(responseDTO, HttpStatus.CREATED);

        } catch (IOException e) {
            e.printStackTrace();
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @PostMapping("/chat")
    public ChatResponse getResponse(@RequestBody ChatRequest chatRequest){
        String aiResponseText = aiChatService.getResponse2(chatRequest.message(), chatRequest.conversionId());
        return new ChatResponse(aiResponseText);
    }


    @GetMapping("/all")
    public ResponseEntity<List<SkillDTO>> getAllSkills() {
        List<Skill> skills = skillRepository.findAll();
        List<SkillDTO> skillDTOs = skillMapper.skillsToDto(skills);
        return new ResponseEntity<>(skillDTOs, HttpStatus.OK);
    }


    @GetMapping("/{id}")
    public ResponseEntity<SkillDTO> getSkill(@PathVariable Long id) {
        return skillRepository.findById(id)
                .map(skill -> new ResponseEntity<>(skillMapper.skillToDto(skill), HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }


    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<SkillDTO>> getSkillsByCategory(@PathVariable Long categoryId) {
        List<Skill> skills = skillRepository.findByCategoryCategoryId(categoryId);
        List<SkillDTO> skillDTOs = skillMapper.skillsToDto(skills);
        return new ResponseEntity<>(skillDTOs, HttpStatus.OK);
    }


    @GetMapping("/user/{userId}")
    public ResponseEntity<List<SkillDTO>> getSkillsByUser(@PathVariable Long userId) {
        List<Skill> skills = skillRepository.findByUserUserId(userId);
        List<SkillDTO> skillDTOs = skillMapper.skillsToDto(skills);
        return new ResponseEntity<>(skillDTOs, HttpStatus.OK);
    }


    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SkillDTO> updateSkill(
            @PathVariable Long id,
            @RequestPart(value = "skill") SkillDTO skillDTO,
            @RequestPart(value = "image", required = false) MultipartFile file) {

        Optional<Skill> skillOptional = skillRepository.findById(id);

        if (skillOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Skill existingSkill = skillOptional.get();
        existingSkill.setTitle(skillDTO.getTitle());
        existingSkill.setDescription(skillDTO.getDescription());
        existingSkill.setMediaUrl(skillDTO.getMediaUrl());

        if (skillDTO.getUserId() != null) {
            userRepository.findById(skillDTO.getUserId()).ifPresent(existingSkill::setUser);
        }

        if (skillDTO.getCategoryId() != null) {
            categoryRepository.findById(skillDTO.getCategoryId()).ifPresent(existingSkill::setCategory);
        }

        if (file != null && !file.isEmpty()) {
            try {
                String safeFileName = ImageUtils.uploadImage(file);
                existingSkill.setImagePath(safeFileName);
            } catch (IOException e) {
                e.printStackTrace();
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }

        Skill updatedSkill = skillRepository.save(existingSkill);
        return new ResponseEntity<>(skillMapper.skillToDto(updatedSkill), HttpStatus.OK);
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSkill(@PathVariable Long id) {
        Optional<Skill> skillOptional = skillRepository.findById(id);

        if (skillOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        Skill skillToDelete = skillOptional.get();

        try {
            List<Comment> comments = commentRepository.findBySkill_SkillId(id);
            commentRepository.deleteAll(comments);
            skillRepository.delete(skillToDelete);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);

        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @PutMapping("/{id}/like")
    public ResponseEntity<SkillDTO> toggleLike(@PathVariable Long id, @RequestParam Long userId) {
        Skill skill = skillRepository.findById(id).orElseThrow();
        Users user = userRepository.findById(userId).orElseThrow();

        if (skill.getLikedByUsers().contains(user)) {
            // המשתמש כבר עשה לייק - אז נסיר אותו
            skill.getLikedByUsers().remove(user);
            skill.setLikesCount(Math.max(0, skill.getLikesCount() - 1));
        } else {
            // המשתמש טרם עשה לייק - נוסיף אותו
            skill.getLikedByUsers().add(user);
            skill.setLikesCount(skill.getLikesCount() + 1);
        }

        skillRepository.save(skill);
        return ResponseEntity.ok(skillMapper.skillToDto(skill));
    }


    @PostMapping("/{id}/comments")
    public ResponseEntity<SkillDTO> addComment(@PathVariable Long id, @RequestBody CommentDTO commentDTO) {
        System.out.println("LOG: Reached POST /api/skills/" + id + "/comments");

        Optional<Skill> skillOptional = skillRepository.findById(id);
        if (skillOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        Skill skill = skillOptional.get();

        Optional<Users> userOptional = userRepository.findById(commentDTO.getUserId());
        if (userOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        Users user = userOptional.get();

        Comment comment = new Comment();
        comment.setContent(commentDTO.getContent());
        comment.setCreatedAt(LocalDate.now());
        comment.setSkill(skill);
        comment.setUser(user);

        commentRepository.save(comment);

        Skill updatedSkill = skillRepository.findById(id).get();
        SkillDTO updatedSkillDTO = skillMapper.skillToDto(updatedSkill);

        return new ResponseEntity<>(updatedSkillDTO, HttpStatus.CREATED);
    }



}