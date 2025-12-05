// ===== lib/hooks/use-routes.ts =====
"use client";

import { useCallback } from "react";
import { useRouteStore } from "../store/route-store";
import { routesApi } from "../api/routes";
import type { RouteRequest } from "../types";

export function useRoutes() {
  const {
    currentRoute,
    loading,
    error,
    setRoute,
    setLoading,
    setError,
    clearRoute,
  } = useRouteStore();

  const calculateRoute = useCallback(
    async (data: RouteRequest) => {
      try {
        setLoading(true);
        setError(null);

        const route = await routesApi.calculateRoute(data);
        setRoute(route);

        return route;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error ||
          err.message ||
          "Failed to calculate route";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [setRoute, setLoading, setError]
  );

  const clear = useCallback(() => {
    clearRoute();
  }, [clearRoute]);

  return {
    route: currentRoute,
    loading,
    error,
    calculateRoute,
    clearRoute: clear,
  };
}
