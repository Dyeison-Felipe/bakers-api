import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';

export type NearExpiryProductOutput = {
  id: string;
  name: string;
  currentStock: number | null;
  unitOfMeasurement: TypeUnitOfMeasurement | null;
  daysUntilExpiry: number;
};
