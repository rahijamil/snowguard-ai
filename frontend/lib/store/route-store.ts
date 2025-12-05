// ===== lib/store/route-store.ts =====
import { create } from "zustand";
import type { RouteResponse } from "../types";

interface RouteState {
  currentRoute: RouteResponse | null;
  loading: boolean;
  error: string | null;
  setRoute: (route: RouteResponse) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearRoute: () => void;
}

export const useRouteStore = create<RouteState>((set) => ({
  currentRoute: null,
  loading: false,
  error: null,
  setRoute: (route) =>
    set({ currentRoute: route, error: null, loading: false }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  clearRoute: () => set({ currentRoute: null, loading: false, error: null }),
}));
