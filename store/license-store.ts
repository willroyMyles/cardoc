import { DynamicDriverLicense } from "@/models";
import { writeStoreToFirestore } from "@/services/firebase/firestore-sync";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const STORE_NAME = "license";

interface LicenseState {
  license: DynamicDriverLicense | null;
  lastSyncedAt: string | null;
  setLicense: (license: DynamicDriverLicense) => void;
  updateLicense: (updates: Partial<DynamicDriverLicense>) => void;
  deleteLicense: () => void;
  hydrateFromFirestore: (
    license: DynamicDriverLicense | null,
    lastSyncedAt: string,
  ) => void;
}

export const useLicenseStore = create<LicenseState>()(
  persist(
    (set, get) => ({
      license: null,
      lastSyncedAt: null,
      setLicense: (license) => {
        const now = new Date().toISOString();
        set({ license, lastSyncedAt: now });
        writeStoreToFirestore(STORE_NAME, get().license, now).catch(() => {});
      },
      updateLicense: (updates) => {
        const now = new Date().toISOString();
        set((state) =>
          state.license
            ? {
                license: { ...state.license, ...updates, updatedAt: now },
                lastSyncedAt: now,
              }
            : {},
        );
        writeStoreToFirestore(STORE_NAME, get().license, now).catch(() => {});
      },
      deleteLicense: () => {
        const now = new Date().toISOString();
        set({ license: null, lastSyncedAt: now });
        writeStoreToFirestore(STORE_NAME, null, now).catch(() => {});
      },
      hydrateFromFirestore: (license, lastSyncedAt) => {
        set({ license, lastSyncedAt });
      },
    }),
    {
      name: "license-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
