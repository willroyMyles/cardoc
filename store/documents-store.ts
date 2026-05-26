import { CarDocument } from "@/models";
import { writeStoreToFirestore } from "@/services/firebase/firestore-sync";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const STORE_NAME = "documents";

interface DocumentsState {
  documents: CarDocument[];
  lastSyncedAt: string | null;
  addDocument: (doc: CarDocument) => void;
  updateDocument: (id: string, updates: Partial<CarDocument>) => void;
  deleteDocument: (id: string) => void;
  deleteDocumentsForVehicle: (vehicleId: string) => void;
  getDocument: (id: string) => CarDocument | undefined;
  getDocumentsForVehicle: (vehicleId: string) => CarDocument[];
  getExpiringDocuments: (withinDays: number) => CarDocument[];
  hydrateFromFirestore: (
    documents: CarDocument[],
    lastSyncedAt: string,
  ) => void;
}

export const useDocumentsStore = create<DocumentsState>()(
  persist(
    (set, get) => ({
      documents: [],
      lastSyncedAt: null,
      addDocument: (doc) => {
        const now = new Date().toISOString();
        set((state) => ({
          documents: [...state.documents, doc],
          lastSyncedAt: now,
        }));
        writeStoreToFirestore(STORE_NAME, get().documents, now).catch(() => {});
      },
      updateDocument: (id, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id ? { ...d, ...updates, updatedAt: now } : d,
          ),
          lastSyncedAt: now,
        }));
        writeStoreToFirestore(STORE_NAME, get().documents, now).catch(() => {});
      },
      deleteDocument: (id) => {
        const now = new Date().toISOString();
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
          lastSyncedAt: now,
        }));
        writeStoreToFirestore(STORE_NAME, get().documents, now).catch(() => {});
      },
      deleteDocumentsForVehicle: (vehicleId) => {
        const now = new Date().toISOString();
        set((state) => ({
          documents: state.documents.filter((d) => d.vehicleId !== vehicleId),
          lastSyncedAt: now,
        }));
        writeStoreToFirestore(STORE_NAME, get().documents, now).catch(() => {});
      },
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
      hydrateFromFirestore: (documents, lastSyncedAt) => {
        set({ documents, lastSyncedAt });
      },
    }),
    {
      name: "documents-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
