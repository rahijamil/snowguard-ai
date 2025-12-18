// ===== lib/hooks/use-dashboard.ts (NEW FILE) =====
"use client";

import { useCallback } from "react";
import { dashboardApi } from "../api/dashboard";
import { useDashboardStore } from "../store/dashboard-store";

export function useDashboard() {
  const { data, loading, error, setData, setLoading, setError, clearData } =
    useDashboardStore();

  const fetchDashboard = useCallback(
    async (lat: number, lon: number, radius: number = 5.0) => {
      try {
        setLoading(true);
        setError(null);
        const dashboardData = await dashboardApi.getDashboard(lat, lon, radius);
        setData(dashboardData);
        return dashboardData;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error ||
          err.message ||
          "Failed to fetch dashboard data";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [setData, setLoading, setError]
  );

  const fetchQuickDashboard = useCallback(
    async (lat: number, lon: number) => {
      try {
        setLoading(true);
        setError(null);
        const dashboardData = await dashboardApi.getQuickDashboard(lat, lon);
        setData(dashboardData);
        return dashboardData;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error ||
          err.message ||
          "Failed to fetch dashboard data";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [setData, setLoading, setError]
  );

  const refresh = useCallback(
    async (lat: number, lon: number, radius: number = 5.0) => {
      return fetchDashboard(lat, lon, radius);
    },
    [fetchDashboard]
  );

  return {
    data,
    loading,
    error,
    fetchDashboard,
    fetchQuickDashboard,
    refresh,
    clearData,
  };
}
