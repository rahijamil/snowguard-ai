import { api } from "./client";

export interface HistoricalHazard {
  id: number;
  latitude: number;
  longitude: number;
  hazardType: string;
  severity: number;
  description?: string;
  timestamp: string;
}

export interface HistoricalRoute {
  id: number;
  fromLatitude: number;
  fromLongitude: number;
  toLatitude: number;
  toLongitude: number;
  distanceMeters: number;
  durationSeconds: number;
  riskScore: number;
  createdAt: string;
}

export interface ChatHistoryItem {
  id: number;
  prompt: string;
  response: string;
  created_at: string;
  model_used?: string;
  tokens_used?: number;
}

export const historyApi = {
  // Fetch hazard history
  async getHazardHistory(
    lat: number,
    lon: number,
    radius: number = 5.0,
    days: number = 7
  ): Promise<HistoricalHazard[]> {
    const response = await api.get("/api/hazards/history", {
      params: { lat, lon, radius, days },
    });
    return response.data;
  },

  // Fetch route history
  async getRouteHistory(limit: number = 20): Promise<HistoricalRoute[]> {
    const response = await api.get("/api/route/history", {
      params: { limit },
    });
    return response.data;
  },

  // Fetch chat history
  async getChatHistory(
    userId: number,
    limit: number = 20,
    offset: number = 0
  ): Promise<{
    user_id: number;
    total_count: number;
    count: number;
    limit: number;
    offset: number;
    chats: ChatHistoryItem[];
  }> {
    const response = await api.get(`/api/chat/history/${userId}`, {
      params: { limit, offset },
    });
    return response.data;
  },

  // Delete specific chat
  async deleteChat(userId: number, chatId: number): Promise<void> {
    await api.delete(`/api/chat/history/${userId}`, {
      params: { chat_id: chatId },
    });
  },

  // Delete all chat history
  async deleteAllChats(userId: number): Promise<void> {
    await api.delete(`/api/chat/history/${userId}`);
  },
};
