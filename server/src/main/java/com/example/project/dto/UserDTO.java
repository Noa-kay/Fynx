package com.example.project.dto;

public class UserDTO {
    private Long userId;
    private String username;
    private String email;
    private String userAvatarUrl;
    private String title;
    private String location;
    private String bio;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String userName) { this.username = userName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getUserAvatarUrl() {
        return userAvatarUrl;
    }
    public void setUserAvatarUrl(String userAvatarUrl) { this.userAvatarUrl = userAvatarUrl; }


    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

}
