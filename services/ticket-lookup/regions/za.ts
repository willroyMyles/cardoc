import { TicketLookupProvider } from "../provider";

export const zaProviders: TicketLookupProvider[] = [
  {
    regionCode: "za",
    displayName: "South Africa — AARTO / eNaTIS",
    lookupUrl: (ticketNumber) =>
      ticketNumber
        ? `https://www.aarto.gov.za/#!/public/infringement/${encodeURIComponent(ticketNumber)}`
        : "https://www.aarto.gov.za/",
    instructions:
      "Look up AARTO infringement notices using your infringement number. Log in to view your full infringement history.",
  },
  {
    regionCode: "za",
    displayName: "South Africa — eNaTIS Vehicle/License",
    lookupUrl: () => "https://www.enatis.com",
    instructions:
      "Check vehicle registration, roadworthy status, and traffic fines on the eNaTIS portal.",
  },
];
