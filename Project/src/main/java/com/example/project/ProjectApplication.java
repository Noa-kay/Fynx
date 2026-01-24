package com.example.project;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;

import java.io.File;


// Crucial: excludes Spring's default security setup
@SpringBootApplication(exclude = {SecurityAutoConfiguration.class})
public class ProjectApplication {
    public static void main(String[] args) {

        // 🚨 הוסף את הקוד כאן!
        String actualPath = System.getProperty("user.dir") + File.separator + "images" + File.separator;
        System.out.println("-------------------------------------------------------");
        System.out.println("DEBUG: האפליקציה רצה מתוך נתיב: " + System.getProperty("user.dir"));
        System.out.println("DEBUG: נתיב העלאת הקבצים הצפוי: " + actualPath);
        System.out.println("-------------------------------------------------------");
        // 🚨 עד כאן




        SpringApplication.run(ProjectApplication.class, args);
    }
}