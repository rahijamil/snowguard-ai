package com.rahi.hazardservice.exception;

import lombok.Getter;

@Getter
public class ExternalApiException extends RuntimeException {
    private final String service;
    
    public ExternalApiException(String service, String message) {
        super(message);
        this.service = service;
    }
    
    public ExternalApiException(String service, String message, Throwable cause) {
        super(message, cause);
        this.service = service;
    }
}