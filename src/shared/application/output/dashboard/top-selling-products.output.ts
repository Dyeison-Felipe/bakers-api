import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';

export type TopSellingProductOutput = {
  productId: string;
  productName: string;
  unitOfMeasurement: TypeUnitOfMeasurement;
  quantitySold: number;
};
