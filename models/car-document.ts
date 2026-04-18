export type CarDocumentType =
  | "registration"
  | "insurance"
  | "inspection"
  | "title"
  | "roadworthy"
  | "emission"
  | "other";

export const CAR_DOCUMENT_TYPE_LABELS: Record<CarDocumentType, string> = {
  registration: "Registration",
  insurance: "Insurance",
  inspection: "Inspection",
  title: "Title / Ownership",
  roadworthy: "Roadworthy Certificate",
  emission: "Emission Certificate",
  other: "Other",
};

export interface CarDocument {
  id: string;
  vehicleId: string;
  type: CarDocumentType;
  title?: string;
  documentNumber: string;
  issuingAuthority?: string;
  issueDate: string;
  expiryDate: string;
  imageUri?: string;
  pdfUri?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
