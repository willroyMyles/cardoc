export type TicketStatus = "unpaid" | "paid" | "disputed" | "dismissed";

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  disputed: "Disputed",
  dismissed: "Dismissed",
};

export interface Ticket {
  id: string;
  vehicleId?: string;
  ticketNumber: string;
  violation: string;
  date: string;
  dueDate?: string;
  amount: number;
  currency: string;
  status: TicketStatus;
  issuingAuthority?: string;
  region?: string;
  notes?: string;
  imageUri?: string;
  createdAt: string;
  updatedAt: string;
}
