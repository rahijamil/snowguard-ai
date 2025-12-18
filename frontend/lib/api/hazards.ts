// ===== lib/api/hazards.ts =====
import type { HazardResponse } from "../types";

export const hazardsApi = {
  async getHazards(
    lat: number,
    lon: number,
    radius: number = 5.0
  ): Promise<HazardResponse> {
    const response = await fetch("/api/hazards/get-hazards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lat, lon, radius }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Get Hazard failed");
    }

    return await response.json();
  },

  async getHistory(
    lat: number,
    lon: number,
    radius: number = 5.0,
    days: number = 7
  ): Promise<any[]> {
    const response = await fetch("/api/hazards/get-history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lat, lon, radius, days }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Hazard History failed");
    }

    return await response.json();
  },
};
