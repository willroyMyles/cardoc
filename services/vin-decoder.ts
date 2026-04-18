/**
 * VIN Decoder using the NHTSA free API (no API key required).
 * https://vpic.nhtsa.dot.gov/api/
 */

export interface VINDecodeResult {
  make: string;
  model: string;
  year: number;
  bodyType: string;
  engineType: string;
}

interface NHTSAValue {
  Variable: string;
  Value: string | null;
}

export async function decodeVIN(
  vin: string,
): Promise<Partial<VINDecodeResult>> {
  const trimmed = vin.trim().toUpperCase();
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${trimmed}?format=json`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`VIN decode failed: ${response.status}`);
  }

  const data = await response.json();
  const results: NHTSAValue[] = data?.Results?.[0]
    ? Object.entries(data.Results[0]).map(([Variable, Value]) => ({
        Variable,
        Value: Value as string | null,
      }))
    : [];

  const get = (key: string) =>
    results.find((r) => r.Variable === key)?.Value ?? "";

  const yearStr = get("ModelYear");
  return {
    make: get("Make"),
    model: get("Model"),
    year: yearStr ? parseInt(yearStr, 10) : undefined,
    bodyType: get("BodyClass"),
    engineType: get("FuelTypePrimary"),
  };
}
