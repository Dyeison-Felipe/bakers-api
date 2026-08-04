import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { TypeDailyProductionItemStatus } from '@/shared/infra/enums/daily-production';

export type DailyProductionItemOutput = {
  id: string;
  product: {
    id: string;
    name: string;
  };
  unitOfMeasurement: TypeUnitOfMeasurement;
  plannedQuantity: number | null;
  recipeMultiplier: number | null;
  plannedWeight: number | null;
  plannedCost: number;
  status: TypeDailyProductionItemStatus;
  actualQuantity: number | null;
  actualWeight: number | null;
  producedAt: Date | null;
};
