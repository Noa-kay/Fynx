package com.example.project.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.UUID;


public class ImageUtils {

    private static String UPLOAD_DIRECTORY = System.getProperty("user.dir") + "\\images\\";

    public static String uploadImage(MultipartFile file) throws IOException {
        Path uploadPath = Paths.get(UPLOAD_DIRECTORY);

        if(!Files.exists(uploadPath)){
            Files.createDirectories(uploadPath);
        }

        String originalFileName = file.getOriginalFilename();
        String fileExtension = "";

        if (originalFileName != null && originalFileName.lastIndexOf(".") != -1) {
            fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }

        String safeFileName = UUID.randomUUID().toString() + fileExtension;

        Path fileNamePath = uploadPath.resolve(safeFileName);
        Files.write(fileNamePath, file.getBytes());

        return safeFileName;
    }

    public static String getImage(String path) throws IOException {
        Path fileName = Paths.get(UPLOAD_DIRECTORY+path);
        byte[] byteImage = Files.readAllBytes(fileName);
        return Base64.getEncoder().encodeToString(byteImage);
    }
}