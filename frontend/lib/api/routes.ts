// ===== lib/api/routes.ts =====
import type { RouteRequest, RouteResponse } from "../types";
import axios from "axios";

export const routesApi = {
  async calculateRoute(data: RouteRequest): Promise<RouteResponse> {
    const response = await axios.get("/api/routes/calculate", {
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
