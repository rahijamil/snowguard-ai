package com.rahi.userservice.entity;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccessibilityPreferences {
    private String fontSize; // e.g., "small", "medium", "large"
    private Boolean highContrast; // true/false
    private Boolean ttsEnabled; // text-to-speech preference
    private Boolean voiceCommands; // whether voice commands are enabled
}
