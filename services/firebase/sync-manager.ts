import type { CarDocument } from "@/models/car-document";
import type { DynamicDriverLicense } from "@/models/driver-license";
import type { FuelEntry } from "@/models/fuel-log";
import type { MaintenanceEntry } from "@/models/maintenance";
import type { Ticket } from "@/models/ticket";
import type { Vehicle } from "@/models/vehicle";
import { useAuthStore } from "@/store/auth-store";
import { useDocumentsStore } from "@/store/documents-store";
import { useFuelStore } from "@/store/fuel-store";
import { useLicenseStore } from "@/store/license-store";
import { useMaintenanceStore } from "@/store/maintenance-store";
import { useSettingsStore } from "@/store/settings-store";
import { useTicketsStore } from "@/store/tickets-store";
import { useVehiclesStore } from "@/store/vehicles-store";
import {
    readStoreFromFirestore,
    writeStoreToFirestore,
} from "./firestore-sync";

interface StoreConfig<T> {
  name: string;
  getData: () => T;
  getLastSyncedAt: () => string | null;
  hydrate: (data: T, lastSyncedAt: string) => void;
  hasData: (data: T) => boolean;
}

async function reconcileStore<T>(config: StoreConfig<T>): Promise<void> {
  const remote = await readStoreFromFirestore<T>(config.name);
  const localData = config.getData();
  const localLastSyncedAt = config.getLastSyncedAt();

  if (!remote) {
    // Nothing in Firestore yet — push local up if we have data
    if (config.hasData(localData)) {
      const ts = localLastSyncedAt ?? new Date().toISOString();
      await writeStoreToFirestore(config.name, localData, ts);
    }
    return;
  }

  const localTs = localLastSyncedAt ? new Date(localLastSyncedAt).getTime() : 0;
  const remoteTs = new Date(remote.lastSyncedAt).getTime();

  if (remoteTs > localTs) {
    // Online is further ahead — pull from Firestore and update local
    config.hydrate(remote.data, remote.lastSyncedAt);
  } else if (localTs > remoteTs) {
    // Local is further ahead — push to Firestore
    await writeStoreToFirestore(config.name, localData, localLastSyncedAt!);
  }
  // Equal timestamps → already in sync, do nothing
}

/**
 * Reconcile all stores against Firestore on app startup.
 * Silently skips if online sync is disabled or user is not signed in.
 */
export async function syncAllStores(): Promise<void> {
  const { syncMode } = useSettingsStore.getState();
  const { user } = useAuthStore.getState();
  if (syncMode !== "online" || !user) return;

  const storeResults = await Promise.allSettled([
    reconcileStore<Vehicle[]>({
      name: "vehicles",
      getData: () => useVehiclesStore.getState().vehicles,
      getLastSyncedAt: () => useVehiclesStore.getState().lastSyncedAt,
      hydrate: (data, ts) =>
        useVehiclesStore.getState().hydrateFromFirestore(data, ts),
      hasData: (d) => d.length > 0,
    }),
    reconcileStore<CarDocument[]>({
      name: "documents",
      getData: () => useDocumentsStore.getState().documents,
      getLastSyncedAt: () => useDocumentsStore.getState().lastSyncedAt,
      hydrate: (data, ts) =>
        useDocumentsStore.getState().hydrateFromFirestore(data, ts),
      hasData: (d) => d.length > 0,
    }),
    reconcileStore<FuelEntry[]>({
      name: "fuel",
      getData: () => useFuelStore.getState().entries,
      getLastSyncedAt: () => useFuelStore.getState().lastSyncedAt,
      hydrate: (data, ts) =>
        useFuelStore.getState().hydrateFromFirestore(data, ts),
      hasData: (d) => d.length > 0,
    }),
    reconcileStore<DynamicDriverLicense | null>({
      name: "license",
      getData: () => useLicenseStore.getState().license,
      getLastSyncedAt: () => useLicenseStore.getState().lastSyncedAt,
      hydrate: (data, ts) =>
        useLicenseStore.getState().hydrateFromFirestore(data, ts),
      hasData: (d) => d !== null,
    }),
    reconcileStore<MaintenanceEntry[]>({
      name: "maintenance",
      getData: () => useMaintenanceStore.getState().entries,
      getLastSyncedAt: () => useMaintenanceStore.getState().lastSyncedAt,
      hydrate: (data, ts) =>
        useMaintenanceStore.getState().hydrateFromFirestore(data, ts),
      hasData: (d) => d.length > 0,
    }),
    reconcileStore<Ticket[]>({
      name: "tickets",
      getData: () => useTicketsStore.getState().tickets,
      getLastSyncedAt: () => useTicketsStore.getState().lastSyncedAt,
      hydrate: (data, ts) =>
        useTicketsStore.getState().hydrateFromFirestore(data, ts),
      hasData: (d) => d.length > 0,
    }),
  ]);

  const failures = storeResults
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) =>
      r.reason instanceof Error ? r.reason.message : String(r.reason),
    );

  if (failures.length > 0) {
    throw new Error(`Sync failed: ${failures.join("; ")}`);
  }
}
