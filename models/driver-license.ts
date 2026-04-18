export interface DriverLicense {
  id: string;
  fullName: string;
  licenseNumber: string;
  dateOfBirth: string;
  issueDate: string;
  expiryDate: string;
  licenseClass: string;
  restrictions?: string;
  issuingRegion: string;
  issuingAuthority?: string;
  address?: string;
  imageUriFront?: string;
  imageUriBack?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Jamaican Driver's Licence
 * Issued by the Tax Administration Jamaica (TAJ) / Collector of Taxes.
 */
export interface JamaicanDriverLicense extends DriverLicense {
  /** Tax Registration Number (TRN) */
  trn: string;
  /** Control number printed on the back of the card */
  controlNumber: string;
  /** Collectorate code and name (e.g. "021 OLD HARBOUR") */
  collectorate: string;
  /** Nationality as printed on the card (e.g. "JAMAICAN") */
  nationality: string;
  /** Original date of issue (may differ from current issueDate on renewals) */
  originalIssueDate: string;
  /** "LICENSE TO DRIVE" field — permitted vehicle categories (e.g. "PVT M/CRS & TRCKS N/E 3000KGS L/W") */
  licenseToDrive?: string;
  /** Transmission restriction if applicable (e.g. "AUTOMATIC TRANSMISSION ONLY") */
  transmissionRestriction?:
    | "AUTOMATIC TRANSMISSION ONLY"
    | "MANUAL TRANSMISSION ONLY"
    | "OPEN";
  /** Judicial endorsement(s) printed on the back */
  judicialEndorsement?: string;
  /** Biological sex as printed on the card */
  sex: "M" | "F";
  /** "DATE" field printed on the card (may differ from issueDate on renewals) */
  date?: string;
}
