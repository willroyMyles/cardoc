export type MaintenanceType =
  | "oil_change"
  | "tire_rotation"
  | "brake_service"
  | "battery"
  | "air_filter"
  | "transmission"
  | "coolant"
  | "spark_plugs"
  | "wiper_blades"
  | "wheel_alignment"
  | "general_service"
  | "repair"
  | "other";

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  oil_change: "Oil Change",
  tire_rotation: "Tire Rotation",
  brake_service: "Brake Service",
  battery: "Battery Replacement",
  air_filter: "Air Filter",
  transmission: "Transmission Service",
  coolant: "Coolant Flush",
  spark_plugs: "Spark Plugs",
  wiper_blades: "Wiper Blades",
  wheel_alignment: "Wheel Alignment",
  general_service: "General Service",
  repair: "Repair",
  other: "Other",
};

export interface MaintenanceEntry {
  id: string;
  vehicleId: string;
  type: MaintenanceType;
  description?: string;
  date: string;
  mileage?: number;
  cost?: number;
  currency: string;
  workshop?: string;
  notes?: string;
  nextServiceDate?: string;
  nextServiceMileage?: number;
  createdAt: string;
  updatedAt: string;
}
