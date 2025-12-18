// ===== lib/hooks/use-voice-commands.ts =====
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "../store/auth-store";
import { useRouter } from "next/navigation";

export function useVoiceCommands() {
  const { preferences } = useAuthStore();
  const router = useRouter();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  // Check browser support on mount
  const [supported] = useState(() => {
    if (typeof window === "undefined") return false;
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    return !!SpeechRecognition;
  });

  const processCommand = useCallback(
    (command: string) => {
      console.log("Processing command:", command);

      // Navigation commands
      if (command.includes("dashboard") || command.includes("home")) {
        router.push("/dashboard");
      } else if (command.includes("map")) {
        router.push("/map");
      } else if (command.includes("chat") || command.includes("assistant")) {
        router.push("/chat");
      } else if (command.includes("settings")) {
        router.push("/settings");
      } else if (command.includes("history")) {
        router.push("/history");
      }
    },
    [router]
  );

  // Initialize speech recognition
  useEffect(() => {
    if (!supported || typeof window === "undefined") return;
    if (!preferences.voiceCommands) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcriptText = event.results[current][0].transcript.toLowerCase();
      setTranscript(transcriptText);

      // Process commands when finalized
      if (event.results[current].isFinal) {
        processCommand(transcriptText);
        setTranscript("");
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [preferences.voiceCommands, supported, processCommand]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && preferences.voiceCommands && supported) {
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch (error) {
        console.error("Failed to start recognition:", error);
      }
    }
  }, [preferences.voiceCommands, supported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      setTranscript("");
    }
  }, []);

  return {
    listening,
    transcript,
    startListening,
    stopListening,
    isEnabled: preferences.voiceCommands,
    supported,
  };
}
