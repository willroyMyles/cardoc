export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  chassis: string;
  licensePlate: string;
  color: string;
  bodyType?: string;
  imageUri?: string;
  createdAt: string;
  updatedAt: string;
}
