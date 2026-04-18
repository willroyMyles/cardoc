import { TicketLookupProvider } from "../provider";

export const usProviders: TicketLookupProvider[] = [
  {
    regionCode: "us",
    displayName: "US — DMV.org Citation Search",
    lookupUrl: (ticketNumber) =>
      ticketNumber
        ? `https://www.dmv.org/tickets/#search=${encodeURIComponent(ticketNumber)}`
        : "https://www.dmv.org/tickets/",
    instructions:
      "Search for your traffic citation by ticket number or license plate on DMV.org. Select your state to view state-specific lookup tools.",
  },
];
