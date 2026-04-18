import { FuelEntry } from "@/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface FuelState {
  entries: FuelEntry[];
  addEntry: (entry: FuelEntry) => void;
  updateEntry: (id: string, updates: Partial<FuelEntry>) => void;
  deleteEntry: (id: string) => void;
  getEntry: (id: string) => FuelEntry | undefined;
  getEntriesForVehicle: (vehicleId: string) => FuelEntry[];
}

export const useFuelStore = create<FuelState>()(
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
      name: "fuel-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
