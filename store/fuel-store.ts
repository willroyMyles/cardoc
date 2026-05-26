import { FuelEntry } from "@/models";
import { writeStoreToFirestore } from "@/services/firebase/firestore-sync";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const STORE_NAME = "fuel";

interface FuelState {
  entries: FuelEntry[];
  lastSyncedAt: string | null;
  addEntry: (entry: FuelEntry) => void;
  updateEntry: (id: string, updates: Partial<FuelEntry>) => void;
  deleteEntry: (id: string) => void;
  getEntry: (id: string) => FuelEntry | undefined;
  getEntriesForVehicle: (vehicleId: string) => FuelEntry[];
  hydrateFromFirestore: (entries: FuelEntry[], lastSyncedAt: string) => void;
}

export const useFuelStore = create<FuelState>()(
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
      name: "fuel-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
