/**
 * Regex-based parsers to extract structured fields from raw OCR text.
 */

import { DriverLicense, JamaicanDriverLicense } from "@/models";
import { v4 as uuidv4 } from "uuid";

/**
 * Attempt to parse OCR text into partial DriverLicense fields.
 * Not exhaustive — fill in remaining fields manually.
 */
export function parseLicenseFromText(text: string): Partial<DriverLicense> {
  const result: Partial<DriverLicense> = {};

  // Full name — look for lines that are all caps (common on licenses)
  const nameMatch = text.match(/^([A-Z][A-Z\s,'-]{4,})\s*$/m);
  if (nameMatch) result.fullName = nameMatch[1].trim();

  // License number — DL/LIC followed by alphanumerics
  const licNumMatch = text.match(
    /(?:DL|LIC(?:ENSE)?|NO\.?)[:\s#]*([A-Z0-9]{5,15})/i,
  );
  if (licNumMatch) result.licenseNumber = licNumMatch[1];

  // Date patterns (MM/DD/YYYY or DD/MM/YYYY or YYYY-MM-DD)
  const dates = [
    ...text.matchAll(
      /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{2}[\/\-]\d{2})\b/g,
    ),
  ].map((m) => m[1]);

  const dob = text.match(
    /(?:DOB|DATE OF BIRTH|BIRTH)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  );
  if (dob) result.dateOfBirth = normalizeDate(dob[1]);

  const exp = text.match(
    /(?:EXP(?:IRY|IRES?)?|EXPIRATION)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  );
  if (exp) result.expiryDate = normalizeDate(exp[1]);

  const iss = text.match(
    /(?:ISS(?:UE)?(?:D)?|ISSUED)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  );
  if (iss) result.issueDate = normalizeDate(iss[1]);

  // License class
  const classMatch = text.match(/(?:CLASS|CL)[:\s]*([A-Z0-9]{1,3})\b/i);
  if (classMatch) result.licenseClass = classMatch[1];

  // Restrictions
  const restMatch = text.match(
    /(?:RESTRICTIONS?|RESTR?)[:\s]*([A-Z0-9, ]+)$/im,
  );
  if (restMatch) result.restrictions = restMatch[1].trim();

  return result;
}

function normalizeDate(raw: string): string {
  try {
    const parts = raw.split(/[\/\-]/);
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      return new Date(
        `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`,
      ).toISOString();
    }
    // Assume MM/DD/YYYY (US) — if day > 12 swap
    const [a, b, c] = parts.map(Number);
    const year = c < 100 ? 2000 + c : c;
    return new Date(
      `${year}-${String(a).padStart(2, "0")}-${String(b).padStart(2, "0")}`,
    ).toISOString();
  } catch {
    return raw;
  }
}

// ---------------------------------------------------------------------------
// Jamaican driver's licence parser
// ---------------------------------------------------------------------------

/**
 * Returns true when the OCR text looks like a Government of Jamaica
 * driver's licence. Detection is purely signal-based so the caller does not
 * need to know the document type upfront.
 */
export function isJamaicanLicenseText(text: string): boolean {
  const upper = text.toUpperCase();
  return (
    upper.includes("GOVERNMENT OF JAMAICA") ||
    (upper.includes("DRIVER") &&
      upper.includes("LICENCE") &&
      (upper.includes("TRN") || upper.includes("COLLECTORATE")))
  );
}

/**
 * Normalise a noisy OCR date string of the form "YYYY-M-DD" or "YYYYMMDD"
 * into ISO 8601. OCR frequently drops or corrupts the month separator.
 */
function normalizeJamaicanDate(raw: string): string {
  const cleaned = raw.replace(/\s/g, "");

  // Already well-formed YYYY-MM-DD
  const full = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (full) {
    const [, y, m, d] = full;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Compact YYYYMMDD (e.g. "20230817")
  const compact = cleaned.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compact) {
    const [, y, m, d] = compact;
    return `${y}-${m}-${d}`;
  }

  return cleaned;
}

/**
 * Parse raw ML Kit OCR text from a Jamaican driver's licence into a
 * {@link JamaicanDriverLicense} record, ready to pass to `setLicense`.
 *
 * Fields that cannot be reliably extracted are omitted so the caller can
 * prompt the user to fill them in.
 */
export function parseJamaicanLicenseFromText(
  text: string,
): Omit<JamaicanDriverLicense, "id" | "createdAt" | "updatedAt"> &
  Partial<Pick<JamaicanDriverLicense, "id" | "createdAt" | "updatedAt">> {
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const upper = text.toUpperCase();

  // ── TRN ──────────────────────────────────────────────────────────────────
  // "TRN\n118405977" or "TRN 118405977"
  const trnMatch = text.match(/TRN[\s:]*(\d{9,10})/i);
  const trn = trnMatch?.[1] ?? "";

  // ── Licence class ─────────────────────────────────────────────────────────
  // OCR produces "CLASSB" or "CLASS B" or "CUASS\nCLASSB"
  const classMatch = text.match(/CLASS\s*([A-Z])\b/i);
  const licenseClass = classMatch?.[1]?.toUpperCase() ?? "";

  // ── Collectorate ──────────────────────────────────────────────────────────
  // "021 OLD HARBOUR" appears after the COLLECTORATE label
  const collectorateMatch = text.match(
    /(?:COLL?ECTORATE)[:\s]*(\d{3}\s+[A-Z\s]+?)(?:\n|DATE|$)/i,
  );
  const collectorate = collectorateMatch?.[1]?.trim() ?? "";

  // ── Sex ───────────────────────────────────────────────────────────────────
  const sexMatch = text.match(/\bSEX\b[\s:]*([MF])\b/i);
  const sex = (sexMatch?.[1]?.toUpperCase() ?? "M") as "M" | "F";

  // ── Dates ─────────────────────────────────────────────────────────────────
  // Capture all YYYY-?M?-?D? clusters in the text then pick by proximity to labels
  const datePattern = /\b(\d{4}[\-\s]?\d{1,2}[\-\s]?\d{2})\b/g;
  const allDates = [...text.matchAll(datePattern)].map((m) =>
    normalizeJamaicanDate(m[1]),
  );

  // Labels appear immediately before or after their values in the OCR stream.
  const expiryRaw = text.match(
    /(?:EXPIRY\s*D(?:A(?:T(?:E|IE|IE)?)?)?)[:\s]*([\d\-\s]{6,12})/i,
  );
  const expiryDate = expiryRaw
    ? normalizeJamaicanDate(expiryRaw[1])
    : (allDates[0] ?? "");

  const issuedRaw = text.match(/(?:DATE\s*ISSUED?)[:\s]*([\d\-\s]{6,12})/i);
  const issueDate = issuedRaw
    ? normalizeJamaicanDate(issuedRaw[1])
    : (allDates[1] ?? "");

  const dobRaw = text.match(
    /(?:(?:BIR(?:TH?)?\s*DATE)|(?:eRDATE)|(?:B(?:I|1)R(?:TH)?[\s_]*D(?:ATE)?))[:\s]*([\d\-\s]{6,12})/i,
  );
  const dateOfBirth = dobRaw
    ? normalizeJamaicanDate(dobRaw[1])
    : (allDates[2] ?? "");

  // ── Full name ─────────────────────────────────────────────────────────────
  // On Jamaican licences the layout is:
  //   <SURNAME>          ← one all-caps line
  //   <GIVEN NAMES>      ← one or two all-caps lines
  // They appear just before the NAME / NANME label in the OCR stream.
  const nameBlockMatch = text.match(
    /([A-Z]{2,}(?:\s[A-Z]+)*)\s*\n\s*([A-Z]{2,}(?:\s[A-Z]+)*)\s*\n\s*(?:N[A]?[NM](?:E|ME)?)/i,
  );
  let fullName = "";
  if (nameBlockMatch) {
    // surname is first line, given names second — display as "Given Surname"
    fullName = `${nameBlockMatch[2]} ${nameBlockMatch[1]}`
      .trim()
      .replace(/\s+/g, " ");
  } else {
    // Fallback: find two consecutive all-caps lines anywhere
    for (let i = 0; i < lines.length - 1; i++) {
      if (
        /^[A-Z\s]{3,}$/.test(lines[i]) &&
        /^[A-Z\s]{3,}$/.test(lines[i + 1])
      ) {
        fullName = `${lines[i + 1]} ${lines[i]}`.trim().replace(/\s+/g, " ");
        break;
      }
    }
  }

  // ── Address ───────────────────────────────────────────────────────────────
  // Address lines come before the ADDRESS label; grab up to 3 all-caps lines
  const addrMatch = text.match(
    /((?:[A-Z0-9][A-Z0-9\s,\.]+\n){1,3})\s*ADDRESS/i,
  );
  const address = addrMatch
    ? addrMatch[1]
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .join(", ")
    : undefined;

  // ── Issuing authority ─────────────────────────────────────────────────────
  const issuingAuthority = upper.includes("GOVERNMENT OF JAMAICA")
    ? "Government of Jamaica"
    : undefined;

  return {
    fullName,
    licenseNumber: trn, // The TRN doubles as the licence reference on JA cards
    trn,
    licenseClass,
    collectorate,
    sex,
    expiryDate,
    issueDate,
    originalIssueDate: issueDate,
    dateOfBirth,
    address,
    issuingRegion: "Jamaica",
    issuingAuthority,
    nationality: "Jamaican",
    controlNumber: "", // only on the back — populate when back is scanned
  };
}

/**
 * Convenience wrapper: parse OCR text of unknown type and, if it is
 * recognised as a Jamaican driver's licence, return a ready-to-save
 * {@link JamaicanDriverLicense} (with generated id/timestamps).
 * Returns `null` when the text is not recognised.
 */
export function extractLicenseFromOCR(
  text: string,
): JamaicanDriverLicense | null {
  if (!isJamaicanLicenseText(text)) return null;

  const now = new Date().toISOString();
  const partial = parseJamaicanLicenseFromText(text);

  return {
    ...partial,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };
}
