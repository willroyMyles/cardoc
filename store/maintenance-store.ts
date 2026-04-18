import { MaintenanceEntry } from "@/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface MaintenanceState {
  entries: MaintenanceEntry[];
  addEntry: (entry: MaintenanceEntry) => void;
  updateEntry: (id: string, updates: Partial<MaintenanceEntry>) => void;
  deleteEntry: (id: string) => void;
  getEntry: (id: string) => MaintenanceEntry | undefined;
  getEntriesForVehicle: (vehicleId: string) => MaintenanceEntry[];
}

export const useMaintenanceStore = create<MaintenanceState>()(
  persist(
    (set, get) => ({
      entries: [],
      addEntry: (entry) =>
        set((state) => ({ entries: [...state.entries, entry] })),
      updateEntry: (id, updates) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id
              ? { ...e, ...updates, updatedAt: new Date().toISOString() }
              : e,
          ),
        })),
      deleteEntry: (id) =>
        set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),
      getEntry: (id) => get().entries.find((e) => e.id === id),
      getEntriesForVehicle: (vehicleId) =>
        get()
          .entries.filter((e) => e.vehicleId === vehicleId)
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          ),
    }),
    {
      name: "maintenance-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
