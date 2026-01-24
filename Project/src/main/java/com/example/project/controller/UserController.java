package com.example.project.controller;

import com.example.project.security.CustomUserDetails;
import com.example.project.security.jwt.JwtUtils;
import com.example.project.service.EmailService;
import com.example.project.service.ImageUtils;
import com.example.project.service.UserRepository;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.core.Authentication;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import com.example.project.dto.UserDTO;
import com.example.project.model.Users;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
//@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")

public class UserController {

    private UserRepository userRepository;
    private JwtUtils jwtUtils;
    private AuthenticationManager authenticationManager;

    @Autowired
    private EmailService emailService;


    @Autowired
    public UserController(UserRepository userRepository , JwtUtils jwtUtils , AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.jwtUtils = jwtUtils;
        this.authenticationManager = authenticationManager;
    }

    @PostMapping("/signin")
    public ResponseEntity<UserDTO> signin(@RequestBody Users u) {
        Authentication authentication = this.authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(u.getUsername(), u.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        ResponseCookie jwtCookie= jwtUtils.generateJwtCookie(userDetails);

        Users loggedInUser = userRepository.findByUsername(userDetails.getUsername());

        UserDTO userDto = toDTO(loggedInUser);

        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
                .body(userDto);
    }



    @PostMapping("/signup")
    public ResponseEntity<UserDTO> signUp(@RequestBody Users user){
        System.out.println("Reached /signup");
        if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
            System.out.println("Error: UserName is missing in the request body.");
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }

        Users u = userRepository.findByUsername(user.getUsername());
        if (u != null)
            return new ResponseEntity<>(HttpStatus.CONFLICT);

        String pass = user.getPassword();
        user.setPassword(new BCryptPasswordEncoder().encode(pass));

        Users savedUser = userRepository.save(user);

        try {
            if (savedUser.getEmail() != null && !savedUser.getEmail().isEmpty()) {
                String subject = "Welcome to Our Community!";

                // עיצוב ה-HTML עם CSS פנימי (Inline CSS)
                String htmlContent = "<div style=\"margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 10%, #a8edea 20%, #fbc2eb 50%, #ff9a9e 80%, #fecfef 100%); padding: 50px 20px;\">" +
                        "  <div style=\"max-width: 550px; margin: auto; background: rgba(255, 255, 255, 0.95); padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); text-align: center;\">" +
                        "    <div style=\"display: inline-block; padding: 10px; background: white; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.1); margin-bottom: 20px;\">" +
                        "       <span style=\"font-size: 40px;\">🎯</span>" +
                        "    </div>" +
                        "    <h1 style=\"color: #4a4a4a; margin-bottom: 10px; font-size: 28px;\">Welcome, " + savedUser.getUsername() + "!</h1>" +
                        "    <p style=\"font-size: 18px; color: #666; margin-bottom: 25px;\">Explore categories and share your skills with the community.</p>" +
                        "    <div style=\"background-color: #ffffff; border: 1px solid #f0f0f0; padding: 20px; border-radius: 15px; text-align: left; margin-bottom: 30px;\">" +
                        "      <p style=\"margin: 0 0 10px 0; color: #8e44ad; font-weight: bold;\">What can you do now?</p>" +
                        "      <ul style=\"margin: 0; padding-left: 20px; color: #555; line-height: 1.6;\">" +
                        "        <li>Browse different skill categories</li>" +
                        "        <li>Connect with people worldwide</li>" +
                        "        <li>Create your first skill post</li>" +
                        "      </ul>" +
                        "    </div>" +
                        "    <a href=\"http://localhost:4200\" style=\"display: inline-block; background: linear-gradient(to right, #ff9a9e 0%, #fecfef 99%, #fecfef 100%); color: white; padding: 15px 35px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(255, 154, 158, 0.4);\">Go to App</a>" +
                        "    <p style=\"margin-top: 30px; font-size: 11px; color: #999; letter-spacing: 1px;\">PROJECT BY LIEL HOROVITS AND NOA KADISH </p>" +
                        "  </div>" +
                        "</div>";

                emailService.sendHtmlEmail(savedUser.getEmail(), subject, htmlContent);
            }
        } catch (Exception e) {
            System.err.println("DEBUG: Failed to send styled email: " + e.getMessage());
        }


        UserDTO dto = toDTO(savedUser);

        return new ResponseEntity<>(dto, HttpStatus.CREATED);
    }

    /*

    @EventListener(ApplicationReadyEvent.class)
    public void triggerMail() {
        try {
            emailService.sendSimpleEmail("lielhorovits@gmail.com",
                    "בדיקת מערכת - פרויקט גמר",
                    "הי ליאל, המייל נשלח בהצלחה!");
            System.out.println("DEBUG: המייל נשלח בהצלחה!");
        } catch (Exception e) {
            System.err.println("DEBUG: שליחת המייל נכשלה, אבל האפליקציה תמשיך לרוץ. שגיאה: " + e.getMessage());
        }
    }

     */


    @PostMapping("/signout")
    public ResponseEntity<?> signOut(){
        ResponseCookie cookie=jwtUtils.getCleanJwtCookie();
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE,cookie.toString())
               .body("you've been signed out!");
   }


    @GetMapping("/all")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserDTO> users = userRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return new ResponseEntity<>(users, HttpStatus.OK);
    }


    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUser(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(u -> new ResponseEntity<>(toDTO(u), HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }


    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id, @RequestBody Users user) {
        return userRepository.findById(id).map(existing -> {
            existing.setUsername(user.getUsername());
            existing.setEmail(user.getEmail());
            existing.setTitle(user.getTitle());
            existing.setLocation(user.getLocation());
            existing.setBio(user.getBio());
            Users updated = userRepository.save(existing);
            return new ResponseEntity<>(toDTO(updated), HttpStatus.OK);
        }).orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        return userRepository.findById(id).map(u -> {
            userRepository.delete(u);
            return new ResponseEntity<Void>(HttpStatus.NO_CONTENT);
        }).orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }


    @GetMapping("/{userId}/profile")
    public ResponseEntity<UserDTO> getCurrentUserProfile(@PathVariable Long userId) {
        System.out.println("LOG: Reached /api/users/" + userId + "/profile");

        // פשוט מחזירים את הנתונים של המשתמש שכבר מאומת
        return userRepository.findById(userId)
                .map(u -> new ResponseEntity<>(toDTO(u), HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND)); // אם המשתמש לא נמצא
    }


    @PostMapping("/{id}/avatar")
    public ResponseEntity<UserDTO> uploadAvatar(@PathVariable Long id,
                                                @RequestParam("file") MultipartFile file) {
        Optional<Users> userOptional = userRepository.findById(id);

        if (userOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        Users existingUser = userOptional.get();
        if (file.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }

        try {
            String uniqueFileName = ImageUtils.uploadImage(file);
            System.out.println("LOG 1: File name from ImageUtils: " + uniqueFileName);

            existingUser.setAvatarUrl(uniqueFileName);
            Users updated = userRepository.save(existingUser);

            return new ResponseEntity<>(toDTO(updated), HttpStatus.OK);

        } catch (IOException e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR); // 500
        }
    }



    private UserDTO toDTO(Users user) {
        UserDTO dto = new UserDTO();
        dto.setUserId((Long) user.getUserId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setUserAvatarUrl(user.getAvatarUrl());
        dto.setTitle(user.getTitle());
        dto.setLocation(user.getLocation());
        dto.setBio(user.getBio());
        return dto;
    }
}
