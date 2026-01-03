import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, AccessibilityPreferences } from "../types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  preferences: AccessibilityPreferences;
  setAuth: (user: User) => void; // No token parameter
  updateUser: (user: Partial<User>) => void;
  updatePreferences: (preferences: AccessibilityPreferences) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      preferences: {
        fontSize: "medium",
        highContrast: false,
        ttsEnabled: false,
        voiceCommands: false,
      },

      setAuth: (user) => {
        // Token is in httpOnly cookie, just store user
        set({
          user,
          isAuthenticated: true,
          preferences: user.preferences || {
            fontSize: "medium",
            highContrast: false,
            ttsEnabled: false,
            voiceCommands: false,
          },
        });
      },

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),

      updatePreferences: (preferences) => set({ preferences }),

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          preferences: {
            fontSize: "medium",
            highContrast: false,
            ttsEnabled: false,
            voiceCommands: false,
          },
        });
      },
    }),
    {
      name: "snowguard-auth",
      storage: createJSONStorage(() => {
        // Return a no-op storage object for server-side rendering
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
          };
        }
        return localStorage;
      }),
      // Only persist user and preferences, not token
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        preferences: state.preferences,
      }),
    }
  )
);
