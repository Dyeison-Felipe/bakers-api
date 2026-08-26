import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';

export type ProductForSaleOutput = {
  id: string;
  name: string;
  barCode: string | null;
  unitOfMeasurement: TypeUnitOfMeasurement | null;
  salePrice: number | null;
  unitCostPrice: number;
  pricePerKilogram: number | null;
  currentStock: number | null;
  stockManagement: boolean;
  imagePath: string | null;
};
