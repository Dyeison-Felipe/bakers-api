import { TypeDailyProductionStatus } from '@/shared/infra/enums/daily-production';
import { DailyProductionItemOutput } from './daily-production-item.output';

export type DailyProductionOutput = {
  id: string;
  productionDate: Date;
  status: TypeDailyProductionStatus;
  totalPlannedCost: number;
  items: DailyProductionItemOutput[];
};
