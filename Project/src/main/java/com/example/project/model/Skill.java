package com.example.project.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
public class Skill {

    @Id
    @GeneratedValue
    private Long skillId;

    @ManyToOne
    @JoinColumn(name = "userId", nullable = false)
    private Users user;
    private String title;
    private String description;
    private String mediaUrl;

    @Column(name = "created_at", updatable = false)
    private LocalDate createdAt = LocalDate.now();

    private String imagePath;

    @Column(columnDefinition = "int default 0")
    private int likesCount=0;

    @ManyToOne
    @JoinColumn(name = "category_Id", nullable = false)
    private Category category;

    @OneToMany(mappedBy = "skill")
    @JsonIgnore
    private List<Comment> comments = new ArrayList<>();

    @ManyToMany
    private Set<Users> likedByUsers = new HashSet<>();


    public Skill(String title, String description, String mediaUrl, LocalDate createdAt, Category category) {
        this.title = title;
        this.description = description;
        this.mediaUrl = mediaUrl;
        this.createdAt = createdAt;
        this.category = category;
    }

    public Skill() {}

    public Long getSkillId() {
        return skillId;
    }

    public void setSkillId(Long skillId) {
        this.skillId = skillId;
    }

    public Users getUser() {
        return user;
    }

    public void setUser(Users user) {
        this.user = user;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getMediaUrl() {
        return mediaUrl;
    }

    public void setMediaUrl(String mediaUrl) {
        this.mediaUrl = mediaUrl;
    }

    public LocalDate getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDate createdAt) {
        this.createdAt = createdAt;
    }

    public List<Comment> getComments() {
        return comments;
    }

    public void setComments(List<Comment> comments) {
        this.comments = comments;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public String getImagePath(){
        return imagePath;
    }

    public void setImagePath(String image){
        this.imagePath = image;
    }

    public int getLikesCount() {
        return likesCount;
    }

    public void setLikesCount(int likesCount) {
        this.likesCount = likesCount;
    }

    public Set<Users> getLikedByUsers() {
        return likedByUsers;
    }

    public void setLikedByUsers(Set<Users> likedByUsers) {
        this.likedByUsers = likedByUsers;
    }






}
