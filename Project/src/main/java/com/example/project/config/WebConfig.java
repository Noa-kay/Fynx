package com.example.project.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // 🛑 תיקון הנתיב: משתמשים בנתיב יחסי (user.dir) והפורמט הנכון (file:///)
    private static final String UPLOAD_DIR;

    static {
        // בונה אובייקט File לתיקיית images/ שנמצאת בבסיס הפרויקט
        File uploadFile = new File(System.getProperty("user.dir") + File.separator + "images");

        // הנתיב המוחלט
        String absolutePath = uploadFile.getAbsolutePath();

        // הדרך הבטוחה ביותר לבניית URI עבור Spring Boot
        UPLOAD_DIR = "file:" + absolutePath.replace("\\", "/") + "/";

        System.out.println("WebConfig UPLOAD_DIR configured as: " + UPLOAD_DIR);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // המיפוי: /api/files/anything -> הנתיב הפיזי
        registry.addResourceHandler("/api/files/**")
                .addResourceLocations(UPLOAD_DIR);
    }


    @Override
    public void extendMessageConverters(List<HttpMessageConverter<?>> converters) {
        for (HttpMessageConverter<?> converter : converters) {
            if (converter instanceof MappingJackson2HttpMessageConverter) {
                MappingJackson2HttpMessageConverter jacksonConverter = (MappingJackson2HttpMessageConverter) converter;

                MediaType applicationJsonUtf8 = new MediaType(
                        "application", "json", StandardCharsets.UTF_8);

                jacksonConverter.setSupportedMediaTypes(
                        Collections.singletonList(applicationJsonUtf8)
                );
            }
        }
    }
}