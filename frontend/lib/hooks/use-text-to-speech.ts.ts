// ===== lib/hooks/use-text-to-speech.ts =====
"use client";

import { useState, useCallback, useRef } from "react";
import { useAuthStore } from "../store/auth-store";

export function useTextToSpeech() {
  const { preferences } = useAuthStore();
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check browser support on mount
  const [supported] = useState(() => {
    if (typeof window === "undefined") return false;
    return "speechSynthesis" in window;
  });

  const speak = useCallback(
    (text: string) => {
      if (!preferences.ttsEnabled || !supported) {
        console.warn("Text-to-speech not enabled or not supported");
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = "en-US";

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = (event) => {
        console.error("TTS error:", event);
        setSpeaking(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [preferences.ttsEnabled, supported]
  );

  const stop = useCallback(() => {
    if (supported) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, [supported]);

  const pause = useCallback(() => {
    if (supported) {
      window.speechSynthesis.pause();
    }
  }, [supported]);

  const resume = useCallback(() => {
    if (supported) {
      window.speechSynthesis.resume();
    }
  }, [supported]);

  return {
    speak,
    stop,
    pause,
    resume,
    speaking,
    isEnabled: preferences.ttsEnabled,
    supported,
  };
}
