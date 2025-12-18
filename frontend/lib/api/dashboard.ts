// ===============================================
// DASHBOARD API INTEGRATION - FRONTEND
// ===============================================

// ===== lib/api/dashboard.ts (NEW FILE) =====
import { api } from "./client";
import type { HazardResponse } from "../types";
import axios from "axios";

export interface DashboardData {
  userId: number;
  userName: string;
  location: {
    lat: number;
    lon: number;
  };
  preferences: any;
  hazards: HazardResponse;
  aiSuggestions: string | null;
  notifications?: any[];
  timestamp: string;
  error?: string;
}

export const dashboardApi = {
  /**
   * Get complete dashboard data (aggregated from all services)
   */
  async getDashboard(
    lat: number,
    lon: number,
    radius: number = 5.0
  ): Promise<DashboardData> {
    const response = await axios("/api/dashboard", {
      headers: {
        "Content-Type": "application/json",
      },
      params: { lat, lon, radius },
    });

    return response.data;
  },

  /**
   * Get quick dashboard data (reduced radius for faster response)
   */
  async getQuickDashboard(lat: number, lon: number): Promise<DashboardData> {
    const response = await axios("/api/dashboard/quick", {
      headers: {
        "Content-Type": "application/json",
      },
      params: { lat, lon },
    });

    return response.data;
  },
};
