import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';

export type BatchOutput = {
  id: string;
  product: {
    id: string;
    name: string;
  };
  quantity: number;
  remainingQuantity: number;
  unitOfMeasurement: TypeUnitOfMeasurement;
  productionDate: Date;
  expirationDate: Date | null;
  dailyProductionItemId: string | null;
  createdAt: Date;
};
