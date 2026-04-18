export interface TicketLookupProvider {
  regionCode: string;
  displayName: string;
  lookupUrl: (ticketNumber?: string) => string;
  instructions: string;
}
