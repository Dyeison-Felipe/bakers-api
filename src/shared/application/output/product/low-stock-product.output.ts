import { TypeConsumptionUnit, TypeUnitOfMeasurement } from '@/shared/infra/enums/product';

export type LowStockProductOutput = {
  id: string;
  name: string;
  currentStock: number | null;
  stockMin: number | null;
  unitOfMeasurement: TypeUnitOfMeasurement | null;
  consumerUnit: TypeConsumptionUnit | null;
};
