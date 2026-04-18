import { CarDocument } from "@/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface DocumentsState {
  documents: CarDocument[];
  addDocument: (doc: CarDocument) => void;
  updateDocument: (id: string, updates: Partial<CarDocument>) => void;
  deleteDocument: (id: string) => void;
  getDocument: (id: string) => CarDocument | undefined;
  getDocumentsForVehicle: (vehicleId: string) => CarDocument[];
  getExpiringDocuments: (withinDays: number) => CarDocument[];
}

export const useDocumentsStore = create<DocumentsState>()(
  persist(
    (set, get) => ({
      documents: [],
      addDocument: (doc) =>
        set((state) => ({ documents: [...state.documents, doc] })),
      updateDocument: (id, updates) =>
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id
              ? { ...d, ...updates, updatedAt: new Date().toISOString() }
              : d,
          ),
        })),
      deleteDocument: (id) =>
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
        })),
      getDocument: (id) => get().documents.find((d) => d.id === id),
      getDocumentsForVehicle: (vehicleId) =>
        get().documents.filter((d) => d.vehicleId === vehicleId),
      getExpiringDocuments: (withinDays) => {
        const now = new Date();
        const threshold = new Date(
          now.getTime() + withinDays * 24 * 60 * 60 * 1000,
        );
        return get().documents.filter((d) => {
          const expiry = new Date(d.expiryDate);
          return expiry >= now && expiry <= threshold;
        });
      },
    }),
    {
      name: "documents-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
