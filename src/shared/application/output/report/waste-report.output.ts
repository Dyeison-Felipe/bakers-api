import { TypeBatchMovementReason } from '@/shared/infra/enums/batch';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';

export type WasteReportItem = {
  id: string;
  date: Date;
  productId: string;
  productName: string;
  quantity: number;
  unitOfMeasurement: TypeUnitOfMeasurement;
  unitCost: number | null;
  totalCost: number;
  reason: TypeBatchMovementReason;
  reasonDescription: string | null;
};

export type WasteReportDailyPoint = {
  day: string;
  total: number;
};

export type WasteReportProductPoint = {
  productId: string;
  productName: string;
  quantity: number;
  totalCost: number;
};

export type WasteReportOutput = {
  totalWaste: number;
  totalRecoveredAtCost: number;
  dailySeries: WasteReportDailyPoint[];
  byProduct: WasteReportProductPoint[];
  wasteItems: WasteReportItem[];
  recoveredItems: WasteReportItem[];
};
