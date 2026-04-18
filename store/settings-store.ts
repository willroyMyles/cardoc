import { type CountryCode, COUNTRY_LABELS } from "@/services/docs-registry";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export { COUNTRY_LABELS };
export type { CountryCode };

export type CloudProvider = "none" | "supabase" | "appwrite";

interface SettingsState {
  country: CountryCode;
  currency: string;
  cloudProvider: CloudProvider;
  supabaseUrl: string;
  supabaseAnonKey: string;
  appwriteEndpoint: string;
  appwriteProjectId: string;
  notificationsEnabled: boolean;
  biometricLockEnabled: boolean;
  parsingMode: "entity" | "ocr";
  setCountry: (country: CountryCode) => void;
  setCurrency: (currency: string) => void;
  setCloudProvider: (provider: CloudProvider) => void;
  setSupabaseCredentials: (url: string, anonKey: string) => void;
  setAppwriteCredentials: (endpoint: string, projectId: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setBiometricLockEnabled: (enabled: boolean) => void;
  setParsingMode: (mode: "entity" | "ocr") => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      country: "jm",
      currency: "USD",
      cloudProvider: "none",
      supabaseUrl: "",
      supabaseAnonKey: "",
      appwriteEndpoint: "",
      appwriteProjectId: "",
      notificationsEnabled: true,
      biometricLockEnabled: false,
      parsingMode: "ocr",
      setCountry: (country) => set({ country }),
      setCurrency: (currency) => set({ currency }),
      setCloudProvider: (cloudProvider) => set({ cloudProvider }),
      setSupabaseCredentials: (supabaseUrl, supabaseAnonKey) =>
        set({ supabaseUrl, supabaseAnonKey }),
      setAppwriteCredentials: (appwriteEndpoint, appwriteProjectId) =>
        set({ appwriteEndpoint, appwriteProjectId }),
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
