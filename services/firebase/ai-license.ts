import { JamaicanDriverLicense } from "@/models";
import { InlineDataPart, TextPart } from "@react-native-firebase/ai";
import { File } from "expo-file-system";
import { getModel } from "./index";

const PROMPT = `Extract structured data from image/s.
Return ONLY a valid JSON object.
Fields:
- fullName
- licenseNumber (a 7 digit number)
- dateOfBirth (ISO 8601)
- issueDate (ISO 8601)
- expiryDate (ISO 8601)
- licenseClass
- address
- trn (9 digits)
- collectorate
- sex
- nationality
- originalIssueDate (ISO 8601)
- date (ISO 8601)
- licenseToDrive
- controlNumber
- judicialEndorsement
`;

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
 * Uses Firebase AI Logic (Gemini) to extract structured fields from images
 * of a Jamaican driver's licence.
 *
 * @param frontUri - Local or remote URI of the front-of-licence image.
 * @param backUri  - Local or remote URI of the back-of-licence image.
 * @returns A partial JamaicanDriverLicense with confidently-detected fields.
 */
export async function extractLicenseFieldsWithAI(
  frontUri?: string,
  backUri?: string,
): Promise<Partial<JamaicanDriverLicense>> {
  const model = getModel("gemini-2.5-flash");

  const uris = [frontUri, backUri].filter(Boolean) as string[];
  const imageParts = await Promise.all(uris.map(uriToInlineDataPart));
  const textPart: TextPart = { text: PROMPT };

  const result = await model.generateContent([...imageParts, textPart]);
  const raw = result.response.text().trim();

  // Strip markdown code fences if the model wraps the JSON
  const jsonString = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "");

  const parsed = JSON.parse(jsonString) as Record<string, string>;

  const out: Partial<JamaicanDriverLicense> = {};

  if (parsed.fullName) out.fullName = parsed.fullName;
  if (parsed.licenseNumber) out.licenseNumber = parsed.licenseNumber;
  if (parsed.dateOfBirth) out.dateOfBirth = normalizeToISO(parsed.dateOfBirth);
  if (parsed.issueDate) out.issueDate = normalizeToISO(parsed.issueDate);
  if (parsed.expiryDate) out.expiryDate = normalizeToISO(parsed.expiryDate);
  if (parsed.licenseClass) out.licenseClass = parsed.licenseClass;
  if (parsed.address) out.address = parsed.address;
  if (parsed.trn) out.trn = parsed.trn;
  if (parsed.collectorate) out.collectorate = parsed.collectorate;
  if (parsed.sex === "M" || parsed.sex === "F") out.sex = parsed.sex;
  if (parsed.nationality) out.nationality = parsed.nationality;
  if (parsed.originalIssueDate)
    out.originalIssueDate = normalizeToISO(parsed.originalIssueDate);
  if (parsed.date) out.date = normalizeToISO(parsed.date);
  if (parsed.licenseToDrive) out.licenseToDrive = parsed.licenseToDrive;
  if (parsed.controlNumber) out.controlNumber = parsed.controlNumber;
  if (parsed.judicialEndorsement)
    out.judicialEndorsement = parsed.judicialEndorsement;

  return out;
}

function normalizeToISO(value: string): string {
  try {
    return new Date(value).toISOString();
  } catch {
    return value;
  }
}
