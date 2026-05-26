import { type CountryCode, COUNTRY_LABELS } from "@/services/docs-registry";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export { COUNTRY_LABELS };
export type { CountryCode };

export type SyncMode = "local" | "online";

interface SettingsState {
  country: CountryCode;
  currency: string;
  syncMode: SyncMode;
  notificationsEnabled: boolean;
  biometricLockEnabled: boolean;
  parsingMode: "entity" | "ocr";
  setCountry: (country: CountryCode) => void;
  setCurrency: (currency: string) => void;
  setSyncMode: (mode: SyncMode) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setBiometricLockEnabled: (enabled: boolean) => void;
  setParsingMode: (mode: "entity" | "ocr") => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      country: "jamaica",
      currency: "USD",
      syncMode: "local",
      notificationsEnabled: true,
      biometricLockEnabled: false,
      parsingMode: "ocr",
      setCountry: (country) => set({ country }),
      setCurrency: (currency) => set({ currency }),
      setSyncMode: (syncMode) => set({ syncMode }),
      setNotificationsEnabled: (notificationsEnabled) =>
        set({ notificationsEnabled }),
      setBiometricLockEnabled: (biometricLockEnabled) =>
        set({ biometricLockEnabled }),
      setParsingMode: (parsingMode) => set({ parsingMode }),
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
