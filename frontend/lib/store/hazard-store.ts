// ===== lib/store/hazard-store.ts =====
import { create } from "zustand";
import type { HazardResponse } from "../types";

interface HazardState {
  currentHazards: HazardResponse | null;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  setHazards: (hazards: HazardResponse) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearHazards: () => void;
}

export const useHazardStore = create<HazardState>((set) => ({
  currentHazards: null,
  loading: false,
  error: null,
  lastUpdate: null,
  setHazards: (hazards) =>
    set({
      currentHazards: hazards,
      lastUpdate: new Date(),
      error: null,
    }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  clearHazards: () =>
    set({
      currentHazards: null,
      loading: false,
      error: null,
      lastUpdate: null,
    }),
}));
