import { DynamicDriverLicense } from "@/models";
import {
  type CountryCode,
  getDriverLicenseSpec,
} from "@/services/docs-registry";
import { InlineDataPart, TextPart } from "@react-native-firebase/ai";
import { File } from "expo-file-system";
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

async function uriToInlineDataPart(uri: string): Promise<InlineDataPart> {
  let buffer: ArrayBuffer;
  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    buffer = await (await fetch(uri)).arrayBuffer();
  } else {
    buffer = await new File(uri).arrayBuffer();
  }
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return { inlineData: { mimeType: "image/jpeg", data: btoa(binary) } };
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
  const model = getModel("gemini-2.5-flash");
  const spec = getDriverLicenseSpec(country);

  const uris = [frontUri, backUri].filter(Boolean) as string[];
  const imageParts = await Promise.all(uris.map(uriToInlineDataPart));
  const textPart: TextPart = { text: buildPrompt(country) };

  const result = await model.generateContent([...imageParts, textPart]);
  const raw = result.response.text().trim();

  // Strip markdown code fences if the model wraps the JSON
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

function normalizeToISO(value: string): string {
  try {
    return new Date(value).toISOString();
  } catch {
    return value;
  }
}
