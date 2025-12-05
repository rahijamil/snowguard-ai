// ===== lib/api/routes.ts =====
import { api } from "./client";
import type { RouteRequest, RouteResponse } from "../types";

export const routesApi = {
  async calculateRoute(data: RouteRequest): Promise<RouteResponse> {
    const response = await api.get<RouteResponse>("/api/route", {
      params: {
        fromLat: data.fromLat,
        fromLon: data.fromLon,
        toLat: data.toLat,
        toLon: data.toLon,
        pref: data.pref || "safe",
      },
    });
    return response.data;
  },
};
