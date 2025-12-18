// ===== components/shared/accessibility-controls.tsx =====
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2, VolumeX, Mic, MicOff } from "lucide-react";
import { useTextToSpeech } from "@/lib/hooks/use-text-to-speech.ts";
import { useVoiceCommands } from "@/lib/hooks/use-voice-commands.ts";

export default function AccessibilityControls() {
  const { speaking, stop, isEnabled: ttsEnabled } = useTextToSpeech();
  const {
    listening,
    startListening,
    stopListening,
    transcript,
    isEnabled: voiceEnabled,
  } = useVoiceCommands();

  // Don't show if neither feature is enabled
  if (!ttsEnabled && !voiceEnabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {/* Text-to-Speech Control */}
      {ttsEnabled && speaking && (
        <Button
          onClick={stop}
          variant="secondary"
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          title="Stop speaking"
          aria-label="Stop text-to-speech"
        >
          <VolumeX className="h-5 w-5" />
        </Button>
      )}

      {/* Voice Commands Control */}
      {voiceEnabled && (
        <div className="flex flex-col gap-2 items-end">
          <Button
            onClick={listening ? stopListening : startListening}
            variant={listening ? "destructive" : "default"}
            size="icon"
            className={`h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all ${
              listening ? "voice-listening" : ""
            }`}
            title={listening ? "Stop listening" : "Start voice commands"}
            aria-label={
              listening ? "Stop voice commands" : "Start voice commands"
            }
          >
            {listening ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>

          {listening && transcript && (
            <Badge
              variant="secondary"
              className="max-w-[200px] truncate animate-in fade-in-0 slide-in-from-right-2"
            >
              {transcript}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
