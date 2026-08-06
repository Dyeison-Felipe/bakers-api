import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';

export type LeftoverBatchOutput = {
  batchId: string;
  product: {
    id: string;
    name: string;
    currentStock: number | null;
  };
  unitOfMeasurement: TypeUnitOfMeasurement;
  producedQuantity: number;
  remainingQuantity: number;
  potentialLossValue: number;
};

export type FindTodayLeftoverBatchesOutput = {
  items: LeftoverBatchOutput[];
  totalPotentialLoss: number;
};
