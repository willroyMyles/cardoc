export type FuelType =
  | "petrol"
  | "diesel"
  | "electric"
  | "hybrid"
  | "lpg"
  | "other";

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  petrol: "Petrol / Gasoline",
  diesel: "Diesel",
  electric: "Electric",
  hybrid: "Hybrid",
  lpg: "LPG",
  other: "Other",
};

export interface FuelEntry {
  id: string;
  vehicleId: string;
  date: string;
  fuelType: FuelType;
  quantity: number;
  unit: "liters" | "gallons";
  pricePerUnit: number;
  totalCost: number;
  currency: string;
  mileageAtFill: number;
  station?: string;
  fullTank: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
