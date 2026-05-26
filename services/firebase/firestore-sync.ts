import { useAuthStore } from "@/store/auth-store";
import { useSettingsStore } from "@/store/settings-store";
import firestore from "@react-native-firebase/firestore";

export interface StoreSnapshot<T = unknown> {
  data: T;
  lastSyncedAt: string;
}

function getSyncContext(): { uid: string } | null {
  const { syncMode } = useSettingsStore.getState();
  const { user } = useAuthStore.getState();
  if (syncMode !== "online" || !user) return null;
  return { uid: user.uid };
}

function storeRef(uid: string, storeName: string) {
  return firestore()
    .collection("users")
    .doc(uid)
    .collection("stores")
    .doc(storeName);
}

/**
 * Write the full store snapshot to Firestore.
 * No-ops when offline mode or user not signed in.
 * Throws on Firestore errors — callers that want fire-and-forget should .catch(() => {}).
 */
export async function writeStoreToFirestore<T>(
  storeName: string,
  data: T,
  lastSyncedAt: string,
): Promise<void> {
  const ctx = getSyncContext();
  if (!ctx) return;
  await storeRef(ctx.uid, storeName).set({ data, lastSyncedAt });
}

/**
 * Read a store snapshot from Firestore.
 * Returns null when offline mode, user not signed in, or on any error.
 */
export async function readStoreFromFirestore<T>(
  storeName: string,
): Promise<StoreSnapshot<T> | null> {
  const ctx = getSyncContext();
  if (!ctx) return null;
  try {
    const doc = await storeRef(ctx.uid, storeName).get();
    if (!doc.exists) return null;
    return doc.data() as StoreSnapshot<T>;
  } catch {
    return null;
  }
}
