import { CloudSyncProvider } from "./provider";

export type { CloudSyncProvider };

/** @deprecated Cloud sync has moved to Firebase Firestore. */
export function getCloudSyncProvider(): CloudSyncProvider | null {
  return null;
}

/** @deprecated Cloud sync has moved to Firebase Firestore. */
export async function syncToCloud(_allData: object): Promise<void> {}

/** @deprecated Cloud sync has moved to Firebase Firestore. */
export async function syncFromCloud(): Promise<object | null> {
  return null;
}
