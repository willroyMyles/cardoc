/**
 * Best-effort conversion of a natural language or short date string returned
 * by ML Kit entity extraction into an ISO 8601 date string.
 * Returns undefined if the value cannot be parsed.
 */
export function toISO(raw: string): string | undefined {
  if (!raw) return undefined;
  // Try native Date parsing first (handles many formats)
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString();
  // Try common numeric formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
  const numericMatch = raw.match(/(\d{1,4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,4})/);
  if (numericMatch) {
    const [, a, b, c] = numericMatch.map(Number);
    const year = a > 31 ? a : c > 31 ? c : c < 100 ? 2000 + c : c;
    const [month, day] = a > 31 ? [b, c] : [b, a];
    const d2 = new Date(year, month - 1, day);
    if (!isNaN(d2.getTime())) return d2.toISOString();
  }
  return undefined;
}
