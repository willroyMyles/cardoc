export type CloudProvider = "none" | "supabase" | "appwrite";
export type RegionCode = "us" | "za" | "uk" | "au" | "ca" | "other";

export const REGION_LABELS: Record<RegionCode, string> = {
  us: "United States",
  za: "South Africa",
  uk: "United Kingdom",
  au: "Australia",
  ca: "Canada",
  other: "Other",
};

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SettingsState {
  region: RegionCode;
  currency: string;
  cloudProvider: CloudProvider;
  supabaseUrl: string;
  supabaseAnonKey: string;
  appwriteEndpoint: string;
  appwriteProjectId: string;
  notificationsEnabled: boolean;
  biometricLockEnabled: boolean;
  setRegion: (region: RegionCode) => void;
  setCurrency: (currency: string) => void;
  setCloudProvider: (provider: CloudProvider) => void;
  setSupabaseCredentials: (url: string, anonKey: string) => void;
  setAppwriteCredentials: (endpoint: string, projectId: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setBiometricLockEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      region: "other",
      currency: "USD",
      cloudProvider: "none",
      supabaseUrl: "",
      supabaseAnonKey: "",
      appwriteEndpoint: "",
      appwriteProjectId: "",
      notificationsEnabled: true,
      biometricLockEnabled: false,
      setRegion: (region) => set({ region }),
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
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
