"use client";

import { useCallback } from "react";
import { useHazardStore } from "../store/hazard-store";
import { hazardsApi } from "../api/hazards";

export function useHazards() {
  const { currentHazards, loading, error, setHazards, setLoading, setError } =
    useHazardStore();

  const fetchHazards = useCallback(
    async (lat: number, lon: number, radius: number = 5.0) => {
      try {
        setLoading(true);
        setError(null);
        const data = await hazardsApi.getHazards(lat, lon, radius);
        setHazards(data);
        return data;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error || err.message || "Failed to fetch hazards";
        setError(errorMessage);
        // DON'T throw - just set error state
        console.error("Hazards fetch error:", errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [setHazards, setLoading, setError]
  );

  const fetchHistory = useCallback(
    async (
      lat: number,
      lon: number,
      radius: number = 5.0,
      days: number = 7
    ) => {
      try {
        const response = await fetch("/api/hazard/get-history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ lat, lon, radius, days }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch history");
        }

        const data = await response.json();
        return data.history || data || [];
      } catch (err: any) {
        const errorMessage = err.message || "Failed to fetch hazard history";
        console.error("History fetch error:", errorMessage);
        // Return empty array instead of throwing
        return [];
      }
    },
    []
  );

  return {
    hazards: currentHazards,
    loading,
    error,
    fetchHazards,
    fetchHistory,
  };
}
