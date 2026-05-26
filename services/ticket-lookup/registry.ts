import { TicketLookupProvider } from "./provider";
import { jamaicaProviders } from "./regions/jamaica";
import { ukProviders } from "./regions/uk";
import { usProviders } from "./regions/us";
import { zaProviders } from "./regions/za";

const ALL_PROVIDERS: TicketLookupProvider[] = [
  ...usProviders,
  ...zaProviders,
  ...ukProviders,
  ...jamaicaProviders,
];

export function getProvidersByRegion(
  regionCode: string,
): TicketLookupProvider[] {
  return ALL_PROVIDERS.filter((p) => p.regionCode === regionCode);
}

export function getAllProviders(): TicketLookupProvider[] {
  return ALL_PROVIDERS;
}
