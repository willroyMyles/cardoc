import { countries, type CountryCode } from "@/docs";

export type { CountryCode };

export interface FieldSpec {
  type: "string" | "date" | "enum" | "number";
  required?: boolean;
  pattern?: string;
  values?: string[];
  format?: string;
  label?: string;
}

export interface DocSpec {
  type: string;
  label: string;
  issuing_authority: string;
  fields: Record<string, FieldSpec>;
}

/** @deprecated use DocSpec */
export type DriverLicenseSpec = DocSpec;

function toLabel(key: string): string {
  return key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const COUNTRY_LABELS: Record<CountryCode, string> = Object.fromEntries(
  (Object.keys(countries) as CountryCode[]).map((k) => [k, toLabel(k)]),
) as Record<CountryCode, string>;

type CountryModule = Record<string, unknown>;

export function getDriverLicenseSpec(country: CountryCode): DocSpec {
  const mod = countries[country] as CountryModule | undefined;
  if (!mod) throw new Error(`No spec module found for country: ${country}`);

  const spec = mod.driver_license as DocSpec[] | undefined;
  if (!spec) throw new Error(`No driver_license spec for country: ${country}`);
  return spec[0];
}

export function getDocumentSpecs(country: CountryCode): DocSpec[] | undefined {
  const mod = countries[country] as CountryModule | undefined;
  if (!mod) return undefined;
  return mod.document as DocSpec[] | undefined;
}

/** Returns the form-type keys available for a country (e.g. "driver_license", "document"). */
export function getAvailableForms(country: CountryCode): string[] {
  const mod = countries[country];
  if (!mod) return [];
  return Object.keys(mod);
}
