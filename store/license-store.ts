import { JamaicanDriverLicense } from "@/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface LicenseState {
  license: JamaicanDriverLicense | null;
  setLicense: (license: JamaicanDriverLicense) => void;
  updateLicense: (updates: Partial<JamaicanDriverLicense>) => void;
  deleteLicense: () => void;
}

export const useLicenseStore = create<LicenseState>()(
  persist(
    (set) => ({
      license: null,
      setLicense: (license) => set({ license }),
      updateLicense: (updates) =>
        set((state) =>
          state.license
            ? {
                license: {
                  ...state.license,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                },
              }
            : {},
        ),
      deleteLicense: () => set({ license: null }),
    }),
    {
      name: "license-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
