import { TypeConsumptionUnit, TypeProduct, TypeUnitOfMeasurement, TypeUnitOfPurchase } from '@/shared/infra/enums/product';
import { CategoryOutput } from '../category/category.output';

export type FindProductOutput = {
  id: string;
  name: string;
  scaleReference: string | null;
  barCode: string | null;
  ncm: string;
  costPrice: number;
  unitCostPrice: number;
  pricePerKilogram: number | null;
  salePrice: number | null;
  profitPrice: number | null;
  unitOfMeasurement: TypeUnitOfMeasurement | null;
  consumerUnit: TypeConsumptionUnit | null;
  expirationDateInDays: string | null;
  stockManagement: boolean;
  typeProduct: TypeProduct
  currentStock: number | null;
  stockMin: number | null;
  active: boolean;
  description: string | null;
  purchaseUnit: TypeUnitOfPurchase | null;
  quantity: number | null;
  weight: number | null;
  volume: number | null;
  imagePath: string | null;
  category: CategoryOutput;
};
