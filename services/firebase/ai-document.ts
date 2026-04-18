import {
    getDocumentSpecs,
    getDriverLicenseSpec,
    type CountryCode,
    type DocSpec,
} from "@/services/docs-registry";
import { InlineDataPart, TextPart } from "@react-native-firebase/ai";
import { File } from "expo-file-system";
import { getModel } from "./index";

export interface AIDocumentResult {
  category: "driver_license" | "document";
  specType: string;
  label: string;
  issuingAuthority: string;
  fields: Record<string, string>;
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
 * Sends one or more document images to Gemini. Gemini identifies the document
 * type from the country's spec registry and extracts all visible field values.
 *
 * @param country   - The active country code (drives the spec selection).
 * @param imageUris - One or more local file URIs or remote URLs.
 */
export async function detectAndExtractDocument(
  country: CountryCode,
  imageUris: string[],
): Promise<AIDocumentResult> {
  const model = getModel("gemini-2.5-flash");

  const allSpecs: { category: "driver_license" | "document"; spec: DocSpec }[] =
    [];

  try {
    const licenseSpec = getDriverLicenseSpec(country);
    allSpecs.push({ category: "driver_license", spec: licenseSpec });
  } catch {
    // country may not have a license spec
  }

  const docSpecs = getDocumentSpecs(country);
  if (docSpecs) {
    for (const ds of docSpecs) {
      allSpecs.push({ category: "document", spec: ds });
    }
  }

  if (allSpecs.length === 0) {
    throw new Error("No document specs available for this country.");
  }

  const specsSummary = allSpecs
    .map(({ category, spec }) => {
      const fieldLines = Object.entries(spec.fields)
        .map(([k, f]) => `    "${k}": ${f.type}  // ${f.label}`)
        .join("\n");
      return `typeKey: "${category}__${spec.type}"\nlabel: "${spec.label}"\nfields:\n${fieldLines}`;
    })
    .join("\n\n---\n\n");

  const prompt = `You are a document recognition AI. Analyze the provided image(s) and identify which document type it is, then extract all visible field values.

Return ONLY a valid JSON object (no markdown code fences) in this exact structure:
{
  "typeKey": "<the exact typeKey from the list below>",
  "fields": {
    "<fieldKey>": "<extracted value, or empty string if not visible>"
  }
}

Available document types and their fields:
${specsSummary}`;

  const imageParts = await Promise.all(imageUris.map(uriToInlineDataPart));
  const textPart: TextPart = { text: prompt };

  const result = await model.generateContent([...imageParts, textPart]);
  const raw = result.response.text().trim();

  // Strip markdown code fences if the model wraps the JSON
  const jsonString = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "");

  const parsed = JSON.parse(jsonString) as {
    typeKey: string;
    fields: Record<string, string>;
  };

  const separatorIndex = parsed.typeKey.indexOf("__");
  const categoryStr =
    separatorIndex !== -1
      ? parsed.typeKey.slice(0, separatorIndex)
      : "document";
  const specTypeStr =
    separatorIndex !== -1 ? parsed.typeKey.slice(separatorIndex + 2) : "";

  const category = (
    categoryStr === "driver_license" ? "driver_license" : "document"
  ) as "driver_license" | "document";

  const matchedEntry =
    allSpecs.find(
      (s) => s.category === category && s.spec.type === specTypeStr,
    ) ?? allSpecs[0];

  const matchedSpec = matchedEntry.spec;

  // Normalize field values; convert dates to ISO date strings
  const fields: Record<string, string> = {};
  for (const [key, fieldSpec] of Object.entries(matchedSpec.fields)) {
    const val = parsed.fields?.[key];
    if (!val) continue;
    fields[key] = fieldSpec.type === "date" ? normalizeToISO(val) : String(val);
  }

  return {
    category: matchedEntry.category,
    specType: matchedSpec.type,
    label: matchedSpec.label,
    issuingAuthority: matchedSpec.issuing_authority,
    fields,
  };
}

function normalizeToISO(value: string): string {
  try {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  } catch {
    // fall through
  }
  return value;
}
