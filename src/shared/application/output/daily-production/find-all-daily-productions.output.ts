import { TypeDailyProductionStatus } from '@/shared/infra/enums/daily-production';

export type FindAllDailyProductionsOutput = {
  id: string;
  productionDate: Date;
  status: TypeDailyProductionStatus;
  totalPlannedCost: number;
  totalProducedCost: number;
  itemCount: number;
};
