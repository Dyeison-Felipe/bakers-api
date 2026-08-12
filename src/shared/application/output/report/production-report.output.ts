import { TypeDailyProductionItemStatus } from '@/shared/infra/enums/daily-production';

export type ProductionReportItem = {
  id: string;
  productionDate: Date;
  productId: string;
  productName: string;
  plannedQuantity: number | null;
  plannedWeight: number | null;
  plannedCost: number;
  status: TypeDailyProductionItemStatus;
};

export type ProductionReportDailyPoint = {
  day: string;
  total: number;
};

export type ProductionReportOutput = {
  totalPlannedCost: number;
  dailySeries: ProductionReportDailyPoint[];
  items: ProductionReportItem[];
};
