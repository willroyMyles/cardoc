import { CarDocument } from "@/models";

export function parseDocumentFromText(text: string): Partial<CarDocument> {
  const result: Partial<CarDocument> = {};

  // Detect document type from keywords
  const upper = text.toUpperCase();
  if (/REGISTRATION/.test(upper)) result.type = "registration";
  else if (/INSURANCE|POLICY/.test(upper)) result.type = "insurance";
  else if (/INSPECTION|ROADWORTHY|RWC/.test(upper)) result.type = "inspection";
  else if (/TITLE|OWNERSHIP/.test(upper)) result.type = "title";
  else if (/EMISSION|EMISSIONS/.test(upper)) result.type = "emission";

  // Document / policy / certificate number
  const numMatch = text.match(
    /(?:NO\.?|NUMBER|CERT(?:IFICATE)?|POLICY|REG)[:\s#]*([A-Z0-9\-]{4,20})/i,
  );
  if (numMatch) result.documentNumber = numMatch[1];

  // Dates
  const exp = text.match(
    /(?:EXP(?:IRY|IRES?)?|EXPIR(?:ATION|ES?)?|VALID\sUNTIL|VALID\sTO)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  );
  if (exp) result.expiryDate = normalizeDate(exp[1]);

  const iss = text.match(
    /(?:ISS(?:UE)?(?:D)?|DATE\sOF\sISSUE|ISSUE\sDATE)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  );
  if (iss) result.issueDate = normalizeDate(iss[1]);

  // Issuing authority
  const authMatch = text.match(/(?:ISSUED\sBY|AUTHORITY|ISSUER)[:\s]*(.+)$/im);
  if (authMatch) result.issuingAuthority = authMatch[1].trim();

  return result;
}

function normalizeDate(raw: string): string {
  try {
    const parts = raw.split(/[\/\-]/);
    if (parts[0].length === 4) {
      return new Date(
        `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`,
      ).toISOString();
    }
    const [a, b, c] = parts.map(Number);
    const year = c < 100 ? 2000 + c : c;
    return new Date(
      `${year}-${String(a).padStart(2, "0")}-${String(b).padStart(2, "0")}`,
    ).toISOString();
  } catch {
    return raw;
  }
}
