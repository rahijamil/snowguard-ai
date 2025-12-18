// ===== lib/hooks/use-accessibility.ts =====
"use client";

import { useEffect } from "react";
import { useAuthStore } from "../store/auth-store";

export function useAccessibility() {
  const { preferences } = useAuthStore();

  useEffect(() => {
    const root = document.documentElement;

    // Remove all font size classes first
    root.classList.remove(
      "font-small",
      "font-medium",
      "font-large",
      "font-xlarge"
    );

    // Apply new font size class
    root.classList.add(`font-${preferences.fontSize}`);

    // Apply high contrast
    if (preferences.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    // Store in localStorage for persistence across sessions
    localStorage.setItem("accessibility-prefs", JSON.stringify(preferences));
  }, [preferences]);

  return preferences;
}
