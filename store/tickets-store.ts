import { Ticket } from "@/models";
import { writeStoreToFirestore } from "@/services/firebase/firestore-sync";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const STORE_NAME = "tickets";

interface TicketsState {
  tickets: Ticket[];
  lastSyncedAt: string | null;
  addTicket: (ticket: Ticket) => void;
  addTickets: (tickets: Ticket[]) => void;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  deleteTicket: (id: string) => void;
  getTicket: (id: string) => Ticket | undefined;
  getTicketsForVehicle: (vehicleId: string) => Ticket[];
  hasTicket: (id: string) => boolean;
  hydrateFromFirestore: (tickets: Ticket[], lastSyncedAt: string) => void;
}

export const useTicketsStore = create<TicketsState>()(
  persist(
    (set, get) => ({
      tickets: [],
      lastSyncedAt: null,
      addTicket: (ticket) => {
        const now = new Date().toISOString();
        set((state) => ({
          tickets: [...state.tickets, ticket],
          lastSyncedAt: now,
        }));
        writeStoreToFirestore(STORE_NAME, get().tickets, now).catch(() => {});
      },
      addTickets: (newTickets) => {
        const now = new Date().toISOString();
        set((state) => {
          const existingIds = new Set(state.tickets.map((t) => t.id));
          const toAdd = newTickets.filter((t) => !existingIds.has(t.id));
          return { tickets: [...state.tickets, ...toAdd], lastSyncedAt: now };
        });
        writeStoreToFirestore(STORE_NAME, get().tickets, now).catch(() => {});
      },
      updateTicket: (id, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: now } : t,
          ),
          lastSyncedAt: now,
        }));
        writeStoreToFirestore(STORE_NAME, get().tickets, now).catch(() => {});
      },
      deleteTicket: (id) => {
        const now = new Date().toISOString();
        set((state) => ({
          tickets: state.tickets.filter((t) => t.id !== id),
          lastSyncedAt: now,
        }));
        writeStoreToFirestore(STORE_NAME, get().tickets, now).catch(() => {});
      },
      getTicket: (id) => get().tickets.find((t) => t.id === id),
      getTicketsForVehicle: (vehicleId) =>
        get().tickets.filter((t) => t.vehicleId === vehicleId),
      hasTicket: (id) => get().tickets.some((t) => t.id === id),
      hydrateFromFirestore: (tickets, lastSyncedAt) => {
        set({ tickets, lastSyncedAt });
      },
    }),
    {
      name: "tickets-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
