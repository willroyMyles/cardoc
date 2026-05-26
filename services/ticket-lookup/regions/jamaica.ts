import { TicketLookupProvider } from "../provider";

export const jamaicaProviders: TicketLookupProvider[] = [
  {
    regionCode: "jamaica",
    displayName: "Jamaica — Traffic Ticket Lookup (JCF/ITA)",
    instructions:
      "Look up your traffic tickets using your driver's licence number, control number, original issue date, and date of birth via the official government portal.",
    apiLookup: {
      serviceKey: "jamaica",
    },
  },
];
