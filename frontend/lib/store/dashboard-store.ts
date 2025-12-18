// ===== lib/store/dashboard-store.ts (NEW FILE) =====
import { create } from "zustand";
import type { DashboardData } from "../api/dashboard";

interface DashboardState {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  setData: (data: DashboardData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearData: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  data: null,
  loading: false,
  error: null,
  lastUpdate: null,
  setData: (data) =>
    set({
      data,
      lastUpdate: new Date(),
      error: null,
    }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  clearData: () =>
    set({
      data: null,
      loading: false,
      error: null,
      lastUpdate: null,
    }),
}));
