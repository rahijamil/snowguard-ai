"use client";

import { useCallback } from "react";
import { useChatStore } from "../store/chat-store";
import { chatApi } from "../api/chat";
import { useAuthStore } from "../store/auth-store";
import type { ChatRequest } from "../types";

export function useChat() {
  const { messages, loading, addMessage, setLoading } = useChatStore();
  const { user } = useAuthStore();

  const sendMessage = useCallback(
    async (content: string, context?: ChatRequest["context"]) => {
      if (!content.trim()) {
        throw new Error("Message cannot be empty");
      }

      // Add user message immediately
      const userMessage = {
        role: "user" as const,
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };
      addMessage(userMessage);

      try {
        setLoading(true);

        const response = await chatApi.sendMessage({
          user_id: user?.id,
          message: content.trim(),
          context,
        });

        // Parse reply if it's stringified JSON
        let replyContent = response.reply;
        if (typeof replyContent === "string" && replyContent.startsWith('"')) {
          try {
            replyContent = JSON.parse(replyContent);
          } catch {
            // If parsing fails, use as-is
          }
        }

        // Add assistant message with full response
        const assistantMessage = {
          role: "assistant" as const,
          content: replyContent,
          timestamp: response.timestamp || new Date().toISOString(),
        };
        addMessage(assistantMessage);

        // Return full response for UI to use
        return {
          ...response,
          reply: replyContent,
        };
      } catch (error: any) {
        // Add error message
        const errorMessage = {
          role: "assistant" as const,
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date().toISOString(),
        };
        addMessage(errorMessage);

        const errorMsg =
          error.response?.data?.error ||
          error.message ||
          "Failed to send message";
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [user, addMessage, setLoading]
  );

  const analyzeSafety = useCallback(
    async (
      lat: number,
      lon: number,
      destination?: { lat: number; lon: number }
    ) => {
      try {
        const response = await chatApi.analyzeSafety(lat, lon, destination);
        return response;
      } catch (error: any) {
        const errorMsg =
          error.response?.data?.error ||
          error.message ||
          "Failed to analyze safety";
        throw new Error(errorMsg);
      }
    },
    []
  );

  return {
    messages,
    loading,
    sendMessage,
    analyzeSafety,
  };
}
