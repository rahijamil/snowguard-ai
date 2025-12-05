// ===== lib/store/chat-store.ts =====
import { create } from "zustand";
import type { ChatMessage } from "../types";

interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  addMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  loading: false,
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  setLoading: (loading) => set({ loading }),
  clearMessages: () => set({ messages: [] }),
}));
