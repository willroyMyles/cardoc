import jmSpec from "@/docs/jamaica/driver_license.json";

export type CountryCode = "jm";

export const COUNTRY_LABELS: Record<CountryCode, string> = {
  jm: "Jamaica",
};

export interface FieldSpec {
  type: "string" | "date" | "enum";
  required?: boolean;
  pattern?: string;
  values?: string[];
  format?: string;
  label?: string;
}

export interface DriverLicenseSpec {
  type: string;
  label: string;
  issuing_authority: string;
  fields: Record<string, FieldSpec>;
}

const COUNTRY_REGISTRY: Record<CountryCode, DriverLicenseSpec> = {
  jm: (jmSpec as DriverLicenseSpec[])[0],
};

export function getDriverLicenseSpec(country: CountryCode): DriverLicenseSpec {
  return COUNTRY_REGISTRY[country];
}
