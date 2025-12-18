// ===== lib/api/users.ts =====
import { api } from "./client";
import type { User, AccessibilityPreferences } from "../types";
import axios from "axios";

export const usersApi = {
  async getMe(): Promise<User> {
    const response = await axios.get("/api/users/me");
    return response.data;
  },

  async getUser(id: number): Promise<User> {
    const response = await axios.get(`/api/users/get-user-by-id`, {
      params: {
        id,
      },
    });
    return response.data;
  },

  async updatePreferences(
    userId: number,
    preferences: AccessibilityPreferences
  ): Promise<{ message: string; preferences: AccessibilityPreferences }> {
    const response = await axios.post(`/api/users/preferences`, {
      userId,
      preferences,
    });
    return response.data;
  },
};
