// ===== lib/api/users.ts =====
import { api } from "./client";
import type { User, AccessibilityPreferences } from "../types";

export const usersApi = {
  async getMe(): Promise<User> {
    const response = await api.get<User>("/api/users/me");
    return response.data;
  },

  async getUser(id: number): Promise<User> {
    const response = await api.get<User>(`/api/users/${id}`);
    return response.data;
  },

  async updatePreferences(
    userId: number,
    preferences: AccessibilityPreferences
  ): Promise<{ message: string; preferences: AccessibilityPreferences }> {
    const response = await api.put(
      `/api/users/${userId}/preferences`,
      preferences
    );
    return response.data;
  },
};
