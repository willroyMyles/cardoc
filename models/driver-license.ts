import { CountryCode } from "@/services/docs-registry";

export interface DynamicDriverLicense {
  id: string;
  country: CountryCode;
  fields: Record<string, string | undefined>;
  imageUriFront?: string;
  imageUriBack?: string;
  imageUploadCount?: number;
  imageMimeTypeFront?: string;
  imageMimeTypeBack?: string;
  createdAt: string;
  updatedAt: string;
}
