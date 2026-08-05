import { TypeConsumptionUnit } from '@/shared/infra/enums/product';

export type DailyProductionItemRequirementOutput = {
  materialId: string;
  materialName: string;
  recipeQuantity: number;
  requiredQuantity: number;
  consumerUnit: TypeConsumptionUnit | null;
};

export type DailyProductionItemRequirementsOutput = {
  items: DailyProductionItemRequirementOutput[];
};
