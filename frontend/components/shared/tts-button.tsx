// ===== components/shared/tts-button.tsx (Reusable TTS Button) =====
"use client";

import { Button } from "@/components/ui/button";
import { useTextToSpeech } from "@/lib/hooks/use-text-to-speech.ts";
import { Volume2, VolumeX } from "lucide-react";

interface TTSButtonProps {
  text: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export default function TTSButton({
  text,
  variant = "ghost",
  size = "icon",
  className,
}: TTSButtonProps) {
  const { speak, stop, speaking, isEnabled, supported } = useTextToSpeech();

  if (!isEnabled || !supported) return null;

  const handleClick = () => {
    if (speaking) {
      stop();
    } else {
      speak(text);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
      title={speaking ? "Stop reading" : "Read aloud"}
      aria-label={speaking ? "Stop reading" : "Read aloud"}
    >
      {speaking ? (
        <VolumeX className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </Button>
  );
}
