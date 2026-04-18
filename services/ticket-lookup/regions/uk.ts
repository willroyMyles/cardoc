import { TicketLookupProvider } from "../provider";

export const ukProviders: TicketLookupProvider[] = [
  {
    regionCode: "uk",
    displayName: "UK — DVLA Vehicle Enquiry",
    lookupUrl: () => "https://www.check-mot.service.gov.uk/",
    instructions:
      "Check MOT history, tax status, and any outstanding issues for a UK-registered vehicle using the official DVLA service.",
  },
  {
    regionCode: "uk",
    displayName: "UK — Penalty Charge Notice (PCN)",
    lookupUrl: (ticketNumber) =>
      ticketNumber
        ? `https://www.gov.uk/pay-parking-fine`
        : "https://www.gov.uk/pay-parking-fine",
    instructions:
      "Pay or appeal a Penalty Charge Notice (parking fine) via the official GOV.UK service.",
  },
];
