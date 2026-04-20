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

function getMimeType(uri: string): string {
  const lower = uri.toLowerCase().split("?")[0];
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

async function uriToInlineDataPart(
  uri: string,
  knownMimeType?: string,
): Promise<InlineDataPart> {
  const mimeType = knownMimeType ?? getMimeType(uri);

  let buffer: ArrayBuffer;
  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    buffer = await (await fetch(uri)).arrayBuffer();
  } else {
    buffer = await new File(uri).arrayBuffer();
  }

  // Convert binary buffer to base64 in chunks to avoid stack overflow on large files
  const bytes = new Uint8Array(buffer);
  const CHUNK = 8192;
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }

  return {
    inlineData: {
      mimeType: mimeType as any,
      data: btoa(binary),
    },
  };
}

function normalizeToISO(value: string, includeTime = false): string {
  try {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return includeTime ? d.toISOString() : d.toISOString().split("T")[0];
    }
  } catch {
    // fall through
  }
  return value;
}

const DATETIME_TYPES = new Set(["date", "datetime"]);

/**
 * Sends one or more files (images or PDFs) to Gemini. Gemini auto-detects
 * the document type from all available country specs and extracts field values.
 * No prior knowledge of the document type is required.
 *
 * @param country - The active country code (drives the spec registry).
 * @param files   - One or more files to process. Providing `mimeType` is
 *                  strongly recommended when the URI has no file extension
 *                  (e.g. document-picker cache URIs).
 */
export async function detectAndExtractDocument(
  country: CountryCode,
  files: Array<{ uri: string; mimeType?: string }>,
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
        .map(([k, f]) => {
          let line = `    "${k}": ${f.type}  // ${f.label ?? k}`;
          if ((f as any).format) line += ` [format: ${(f as any).format}]`;
          return line;
        })
        .join("\n");
      return `typeKey: "${category}__${spec.type}"\nlabel: "${spec.label}"\nfields:\n${fieldLines}`;
    })
    .join("\n\n---\n\n");

  const prompt = `You are a document recognition AI. Analyze the provided file(s) — which may be images or PDFs — identify which document type it is, then extract all visible field values.
Return ONLY a valid JSON object (no markdown code fences) in this exact structure:
{
  "typeKey": "<the exact typeKey from the list below>",
  "fields": {
    "<fieldKey>": "<extracted value, or empty string if not visible>"
  }
}

Available document types and their fields:
${specsSummary}`;

  const fileParts = await Promise.all(
    files.map((f) => uriToInlineDataPart(f.uri, f.mimeType)),
  );
  const textPart: TextPart = { text: prompt };

  const result = await model.generateContent([...fileParts, textPart]);
  const raw = result.response.text().trim();

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

  const fields: Record<string, string> = {};
  for (const [key, fieldSpec] of Object.entries(matchedSpec.fields)) {
    const val = parsed.fields?.[key];
    if (!val) continue;
    const isDateLike =
      DATETIME_TYPES.has(fieldSpec.type) ||
      (fieldSpec as any).type === "datetime";
    fields[key] = isDateLike
      ? normalizeToISO(val, (fieldSpec as any).type === "datetime")
      : String(val);
  }

  return {
    category: matchedEntry.category,
    specType: matchedSpec.type,
    label: matchedSpec.label,
    issuingAuthority: matchedSpec.issuing_authority,
    fields,
  };
}
