import { MaintenanceEntry } from "@/models";
import { writeStoreToFirestore } from "@/services/firebase/firestore-sync";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const STORE_NAME = "maintenance";

interface MaintenanceState {
  entries: MaintenanceEntry[];
  lastSyncedAt: string | null;
  addEntry: (entry: MaintenanceEntry) => void;
  updateEntry: (id: string, updates: Partial<MaintenanceEntry>) => void;
  deleteEntry: (id: string) => void;
  getEntry: (id: string) => MaintenanceEntry | undefined;
  getEntriesForVehicle: (vehicleId: string) => MaintenanceEntry[];
  hydrateFromFirestore: (
    entries: MaintenanceEntry[],
    lastSyncedAt: string,
  ) => void;
}

export const useMaintenanceStore = create<MaintenanceState>()(
  persist(
    (set, get) => ({
      entries: [],
      lastSyncedAt: null,
      addEntry: (entry) => {
        const now = new Date().toISOString();
        set((state) => ({
          entries: [...state.entries, entry],
          lastSyncedAt: now,
        }));
        writeStoreToFirestore(STORE_NAME, get().entries, now).catch(() => {});
      },
      updateEntry: (id, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: now } : e,
          ),
          lastSyncedAt: now,
        }));
        writeStoreToFirestore(STORE_NAME, get().entries, now).catch(() => {});
      },
      deleteEntry: (id) => {
        const now = new Date().toISOString();
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
          lastSyncedAt: now,
        }));
        writeStoreToFirestore(STORE_NAME, get().entries, now).catch(() => {});
      },
      getEntry: (id) => get().entries.find((e) => e.id === id),
      getEntriesForVehicle: (vehicleId) =>
        get()
          .entries.filter((e) => e.vehicleId === vehicleId)
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          ),
      hydrateFromFirestore: (entries, lastSyncedAt) => {
        set({ entries, lastSyncedAt });
      },
    }),
    {
      name: "maintenance-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
