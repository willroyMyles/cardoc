import { Vehicle } from "@/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface VehiclesState {
  vehicles: Vehicle[];
  addVehicle: (vehicle: Vehicle) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  getVehicle: (id: string) => Vehicle | undefined;
}

export const useVehiclesStore = create<VehiclesState>()(
  persist(
    (set, get) => ({
      vehicles: [],
      addVehicle: (vehicle) =>
        set((state) => ({ vehicles: [...state.vehicles, vehicle] })),
      updateVehicle: (id, updates) =>
        set((state) => ({
          vehicles: state.vehicles.map((v) =>
            v.id === id
              ? { ...v, ...updates, updatedAt: new Date().toISOString() }
              : v,
          ),
        })),
      deleteVehicle: (id) =>
        set((state) => ({
          vehicles: state.vehicles.filter((v) => v.id !== id),
        })),
      getVehicle: (id) => get().vehicles.find((v) => v.id === id),
    }),
    {
      name: "vehicles-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
