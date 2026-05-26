import { Vehicle } from "@/models";
import { writeStoreToFirestore } from "@/services/firebase/firestore-sync";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const STORE_NAME = "vehicles";

interface VehiclesState {
  vehicles: Vehicle[];
  lastSyncedAt: string | null;
  addVehicle: (vehicle: Vehicle) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  getVehicle: (id: string) => Vehicle | undefined;
  hydrateFromFirestore: (vehicles: Vehicle[], lastSyncedAt: string) => void;
}

export const useVehiclesStore = create<VehiclesState>()(
  persist(
    (set, get) => ({
      vehicles: [],
      lastSyncedAt: null,
      addVehicle: (vehicle) => {
        const now = new Date().toISOString();
        set((state) => ({
          vehicles: [...state.vehicles, vehicle],
          lastSyncedAt: now,
        }));
        writeStoreToFirestore(STORE_NAME, get().vehicles, now).catch(() => {});
      },
      updateVehicle: (id, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          vehicles: state.vehicles.map((v) =>
            v.id === id ? { ...v, ...updates, updatedAt: now } : v,
          ),
          lastSyncedAt: now,
        }));
        writeStoreToFirestore(STORE_NAME, get().vehicles, now).catch(() => {});
      },
      deleteVehicle: (id) => {
        const now = new Date().toISOString();
        set((state) => ({
          vehicles: state.vehicles.filter((v) => v.id !== id),
          lastSyncedAt: now,
        }));
        writeStoreToFirestore(STORE_NAME, get().vehicles, now).catch(() => {});
      },
      getVehicle: (id) => get().vehicles.find((v) => v.id === id),
      hydrateFromFirestore: (vehicles, lastSyncedAt) => {
        set({ vehicles, lastSyncedAt });
      },
    }),
    {
      name: "vehicles-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
