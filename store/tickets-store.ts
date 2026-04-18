import { Ticket } from "@/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface TicketsState {
  tickets: Ticket[];
  addTicket: (ticket: Ticket) => void;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  deleteTicket: (id: string) => void;
  getTicket: (id: string) => Ticket | undefined;
  getTicketsForVehicle: (vehicleId: string) => Ticket[];
}

export const useTicketsStore = create<TicketsState>()(
  persist(
    (set, get) => ({
      tickets: [],
      addTicket: (ticket) =>
        set((state) => ({ tickets: [...state.tickets, ticket] })),
      updateTicket: (id, updates) =>
        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === id
              ? { ...t, ...updates, updatedAt: new Date().toISOString() }
              : t,
          ),
        })),
      deleteTicket: (id) =>
        set((state) => ({ tickets: state.tickets.filter((t) => t.id !== id) })),
      getTicket: (id) => get().tickets.find((t) => t.id === id),
      getTicketsForVehicle: (vehicleId) =>
        get().tickets.filter((t) => t.vehicleId === vehicleId),
    }),
    {
      name: "tickets-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
