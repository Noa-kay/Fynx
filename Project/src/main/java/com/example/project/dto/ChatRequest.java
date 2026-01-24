package com.example.project.dto;

public record ChatRequest(String message , String conversionId) {
    public ChatRequest{

        if(conversionId == null || conversionId.isBlank()){
            conversionId = "default-user";
        }

    }


}
