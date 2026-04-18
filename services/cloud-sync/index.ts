import { useSettingsStore } from "@/store";
import { AppwriteSyncProvider } from "./appwrite";
import { CloudSyncProvider } from "./provider";
import { SupabaseSyncProvider } from "./supabase";

export function getCloudSyncProvider(): CloudSyncProvider | null {
  const {
    cloudProvider,
    supabaseUrl,
    supabaseAnonKey,
    appwriteEndpoint,
    appwriteProjectId,
  } = useSettingsStore.getState();

  if (cloudProvider === "supabase" && supabaseUrl && supabaseAnonKey) {
    return new SupabaseSyncProvider(supabaseUrl, supabaseAnonKey);
  }
  if (cloudProvider === "appwrite" && appwriteEndpoint && appwriteProjectId) {
    return new AppwriteSyncProvider(appwriteEndpoint, appwriteProjectId);
  }
  return null;
}

export async function syncToCloud(allData: object): Promise<void> {
  const provider = getCloudSyncProvider();
  if (!provider) throw new Error("No cloud provider configured");
  await provider.upload(allData);
}

export async function syncFromCloud(): Promise<object | null> {
  const provider = getCloudSyncProvider();
  if (!provider) throw new Error("No cloud provider configured");
  return provider.download();
}

export type { CloudSyncProvider };
