import ticketSpec from "@/docs/jamaica/ticket.json";
import { Ticket } from "@/models";

export { ticketSpec };

export interface JamaicaLookupInput {
  driversLicNo: string;
  controlNo: string;
  /** ISO date string: YYYY-MM-DD */
  origLicIssueDate: string;
  /** ISO date string: YYYY-MM-DD */
  dateOfBirth: string;
}

// ─── Spec-driven helpers ──────────────────────────────────────────────────────

type BodyFieldSpec = { source: string; key: string; transform?: string };

/** Build a request body for a step using the spec + resolved input + client IP. */
function buildBodyFromSpec(
  bodyFields: Record<string, BodyFieldSpec>,
  input: JamaicaLookupInput,
  ip: string,
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const [apiKey, spec] of Object.entries(bodyFields)) {
    if (spec.source === "auto" && spec.key === "clientIp") {
      body[apiKey] = ip;
    } else if (spec.source === "input") {
      const raw = input[spec.key as keyof JamaicaLookupInput] ?? "";
      body[apiKey] =
        spec.transform === "iso_date_to_unix_ms" ? isoToUnixMs(raw) : raw;
    }
  }
  return body;
}

/** Build a query string from a step's query spec (e.g. { size: 20, sort: "id,desc" }). */
function buildQueryString(query?: Record<string, unknown>): string {
  if (!query || Object.keys(query).length === 0) return "";
  const params = new URLSearchParams(
    Object.entries(query).map(([k, v]) => [k, String(v)]),
  );
  return `?${params.toString()}`;
}

/**
 * Map a driver's licence field record to a lookup input using the
 * `licenseField` mappings declared in the ticket spec's inputFields.
 */
export function mapLicenseToInput(
  licenseFields: Record<string, string | undefined>,
): Partial<JamaicaLookupInput> {
  const result: Partial<JamaicaLookupInput> = {};
  for (const field of ticketSpec.inputFields) {
    const lf = (field as typeof field & { licenseField?: string }).licenseField;
    if (lf) {
      const value = licenseFields[lf];
      if (value) {
        result[field.id as keyof JamaicaLookupInput] = value;
      }
    }
  }
  return result;
}

/**
 * Returns true when all required lookup input fields can be satisfied
 * by the provided licence fields via the spec mapping.
 */
export function hasLicenseCoverage(
  licenseFields: Record<string, string | undefined>,
): boolean {
  const mapped = mapLicenseToInput(licenseFields);
  return ticketSpec.inputFields
    .filter((f) => f.required)
    .every((f) => !!mapped[f.id as keyof JamaicaLookupInput]);
}

export interface JamaicaTicket {
  ticketNo: string;
  idNumber: string;
  trnNo: string | null;
  issueDate: string;
  offenceCode: string;
  offenceDesc: string;
  fineAmount: string;
  workflowStateCode: string;
  workflowState: string;
  mandatoryCourtApp: string;
  courtDate: string;
  demeritPoints: string;
  offenderFirstName: string;
  offenderLastName: string;
  courtLocation: string;
  paymentDueDate: string;
}

const BASE_URL = ticketSpec.baseUrl;

/** Attempt to resolve the device's public IP; falls back to a default. */
async function resolvePublicIp(): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch("https://api64.ipify.org?format=json", {
      signal: controller.signal,
    });
    const data = await res.json();
    return typeof data.ip === "string" ? data.ip : "0.0.0.0";
  } catch {
    return "0.0.0.0";
  } finally {
    clearTimeout(timeout);
  }
}

/** Convert an ISO date string (YYYY-MM-DD) to epoch milliseconds. */
function isoToUnixMs(isoDate: string): number {
  return new Date(isoDate).getTime();
}

/**
 * Helper to extract error message from API response
 */
async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const contentType = res.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const data = await res.json();
      // Try common error message fields
      return (
        data.message ||
        data.error ||
        data.errorMessage ||
        data.detail ||
        JSON.stringify(data)
      );
    } else {
      const text = await res.text();
      return text || `HTTP ${res.status}: ${res.statusText}`;
    }
  } catch {
    return `HTTP ${res.status}: ${res.statusText}`;
  }
}

/**
 * Step 1 — validate that the licence/control-number combination is found.
 * Returns true if valid, false if not found.
 * Throws on network / HTTP errors.
 */
export async function validateLicence(
  input: JamaicaLookupInput,
): Promise<boolean> {
  const step = ticketSpec.steps.find((s) => s.id === "validate")!;
  try {
    const ip = await resolvePublicIp();
    const body = buildBodyFromSpec(
      step.bodyFields as Record<string, BodyFieldSpec>,
      input,
      ip,
    );

    console.log(JSON.stringify(body));

    const res = await fetch(`${BASE_URL}${step.path}`, {
      method: step.method,
      headers: { "Content-Type": step.contentType },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res);
      throw new Error(`Licence validation failed: ${errorMsg}`);
    }
    return (await res.json()) === true;
  } catch (err) {
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new Error("Network error. Please check your internet connection.");
    }
    throw err;
  }
}

/**
 * Step 2a — fetch all tickets (paid + unpaid).
 * Call only after validateLicence returns true.
 */
export async function fetchAllTickets(
  input: JamaicaLookupInput,
): Promise<JamaicaTicket[]> {
  const step = ticketSpec.steps.find((s) => s.id === "fetch_all")!;
  try {
    const ip = await resolvePublicIp();
    const qs = buildQueryString(
      step.query as Record<string, unknown> | undefined,
    );
    const res = await fetch(`${BASE_URL}${step.path}${qs}`, {
      method: step.method,
      headers: { "Content-Type": step.contentType },
      body: JSON.stringify(
        buildBodyFromSpec(
          step.bodyFields as Record<string, BodyFieldSpec>,
          input,
          ip,
        ),
      ),
    });
    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res);
      throw new Error(`Failed to fetch tickets: ${errorMsg}`);
    }
    return res.json();
  } catch (err) {
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new Error("Network error. Please check your internet connection.");
    }
    throw err;
  }
}

/**
 * Step 2b — fetch only unpaid/outstanding tickets.
 * Call only after validateLicence returns true.
 */
export async function fetchUnpaidTickets(
  input: JamaicaLookupInput,
): Promise<JamaicaTicket[]> {
  const step = ticketSpec.steps.find((s) => s.id === "fetch_unpaid")!;
  try {
    const ip = await resolvePublicIp();
    const qs = buildQueryString(
      step.query as Record<string, unknown> | undefined,
    );
    const res = await fetch(`${BASE_URL}${step.path}${qs}`, {
      method: step.method,
      headers: { "Content-Type": step.contentType },
      body: JSON.stringify(
        buildBodyFromSpec(
          step.bodyFields as Record<string, BodyFieldSpec>,
          input,
          ip,
        ),
      ),
    });
    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res);
      throw new Error(`Failed to fetch unpaid tickets: ${errorMsg}`);
    }
    return res.json();
  } catch (err) {
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new Error("Network error. Please check your internet connection.");
    }
    throw err;
  }
}

/**
 * Performs the full lookup flow in sequence:
 * validate → fetch all & fetch unpaid (in parallel).
 * Returns { all, unpaid } or throws with a user-readable message.
 */
export async function performJamaicaLookup(
  input: JamaicaLookupInput,
): Promise<{ all: JamaicaTicket[]; unpaid: JamaicaTicket[] }> {
  const valid = await validateLicence(input);
  if (!valid) {
    throw new Error(
      ticketSpec.steps[0].errorMessage ??
        "Could not verify your licence details.",
    );
  }
  const [all, unpaid] = await Promise.all([
    fetchAllTickets(input),
    fetchUnpaidTickets(input),
  ]);
  return { all, unpaid };
}

/** Map a JamaicaTicket from the API to the app's Ticket model for storage. */
export function mapToTicket(jt: JamaicaTicket): Ticket {
  const statusRaw = jt.workflowState?.toLowerCase() ?? "";
  const status =
    statusRaw === "paid"
      ? "paid"
      : statusRaw === "dismissed" || statusRaw === "withdrawn"
        ? "dismissed"
        : statusRaw === "disputed"
          ? "disputed"
          : "unpaid";

  // paymentDueDate can be "2026-04-06 17:15:24.445" — extract date part
  const dueDateRaw = jt.paymentDueDate?.split(" ")[0] ?? jt.courtDate ?? "";

  return {
    id: `jm-${jt.ticketNo}`,
    ticketNumber: jt.ticketNo,
    violation: jt.offenceDesc,
    date: jt.issueDate,
    dueDate: dueDateRaw || undefined,
    amount: parseFloat(jt.fineAmount) || 0,
    currency: "JMD",
    status,
    issuingAuthority: "Jamaica Constabulary Force",
    region: "jamaica",
    notes: [
      jt.courtLocation ? `Court: ${jt.courtLocation}` : null,
      jt.demeritPoints ? `Demerit points: ${jt.demeritPoints}` : null,
      jt.mandatoryCourtApp === "true" ? "Mandatory court appearance" : null,
    ]
      .filter(Boolean)
      .join(" | "),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
