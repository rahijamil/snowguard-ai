import { api } from "./client";
import type { ChatRequest, ChatResponse, ChatHistoryResponse } from "../types";

export const chatApi = {
  async sendMessage(data: ChatRequest): Promise<ChatResponse> {
    const response = await fetch("/api/chat/send-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Send Message failed");
    }

    return await response.json();
  },

  async getChatHistory(
    userId: number,
    limit: number = 10,
    offset: number = 0
  ): Promise<ChatHistoryResponse> {
    const response = await api.get(`/api/chat/history/${userId}`, {
      params: { limit, offset },
    });
    return response.data;
  },

  async deleteChatHistory(
    userId: number,
    chatId?: number
  ): Promise<{ message: string; deleted_count: number }> {
    const params = chatId ? { chat_id: chatId } : {};
    const response = await api.delete(`/api/chat/history/${userId}`, {
      params,
    });
    return response.data;
  },

  async analyzeSafety(
    lat: number,
    lon: number,
    destination?: { lat: number; lon: number }
  ): Promise<any> {
    const response = await api.post("/api/safety-analysis", {
      location: { lat, lon },
      destination,
    });
    return response.data;
  },
};
