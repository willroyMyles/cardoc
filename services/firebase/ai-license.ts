import { DynamicDriverLicense } from "@/models";
import {
  type CountryCode,
  getDriverLicenseSpec,
} from "@/services/docs-registry";
import { uriToInlineDataPart } from "@/services/firebase/ai-document";
import { InlineDataPart, TextPart } from "@react-native-firebase/ai";
import { getModel } from "./index";

function buildPrompt(country: CountryCode): string {
  const spec = getDriverLicenseSpec(country);
  const fieldLines = Object.entries(spec.fields)
    .map(([key, fs]) => {
      let desc = `  ${key} → ${fs.type}`;
      if (fs.pattern) desc += ` (pattern: ${fs.pattern})`;
      if (fs.values) desc += `: ${fs.values.join(", ")}`;
      if (fs.format) desc += ` [${fs.format}]`;
      return desc;
    })
    .join("\n");
  return `Extract structured data from image/s of a ${spec.label}.\nReturn ONLY a valid JSON object.\nFields:\n${fieldLines}`;
}

/**
 * Uses Firebase AI Logic (Gemini) to extract structured fields from licence
 * images. The prompt is built dynamically from the country's field spec.
 *
 * @param country  - The active country code (drives the spec and prompt).
 * @param frontUri - Local or remote URI of the front-of-licence image.
 * @param backUri  - Local or remote URI of the back-of-licence image.
 * @returns A Record of field name → extracted value.
 */
export async function extractLicenseFieldsWithAI(
  country: CountryCode,
  frontUri?: string,
  backUri?: string,
): Promise<DynamicDriverLicense["fields"]> {
  const uris = [frontUri, backUri].filter(Boolean) as string[];
  const imageParts = await Promise.all(uris.map((u) => uriToInlineDataPart(u)));
  return runExtraction(country, imageParts);
}

function normalizeToISO(value: string): string {
  try {
    return new Date(value).toISOString();
  } catch {
    return value;
  }
}

async function runExtraction(
  country: CountryCode,
  imageParts: InlineDataPart[],
): Promise<DynamicDriverLicense["fields"]> {
  const model = getModel();
  const spec = getDriverLicenseSpec(country);
  const textPart: TextPart = { text: buildPrompt(country) };
  console.log(textPart.text);

  const result = await model.generateContent([...imageParts, textPart]);
  const raw = result.response.text().trim();

  const jsonString = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "");

  const parsed = JSON.parse(jsonString) as Record<string, string>;

  const out: DynamicDriverLicense["fields"] = {};
  for (const [key, fieldSpec] of Object.entries(spec.fields)) {
    const val = parsed[key];
    if (!val) continue;
    out[key] = fieldSpec.type === "date" ? normalizeToISO(val) : val;
  }
  return out;
}

/**
 * Same as extractLicenseFieldsWithAI but accepts pre-converted InlineDataParts,
 * skipping the URI-to-base64 conversion step.
 */
export async function extractLicenseFieldsFromParts(
  country: CountryCode,
  parts: InlineDataPart[],
): Promise<DynamicDriverLicense["fields"]> {
  return runExtraction(country, parts);
}
