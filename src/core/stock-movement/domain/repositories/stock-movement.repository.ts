import { BaseRepository } from '@/shared/domain/repository/base-repository';
import { TypeStockMovementReason } from '@/shared/infra/enums/stock-movement';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { StockMovement } from '../entities/stock-movement.entity';

export type StockMovementReportItem = {
  id: string;
  createdAt: Date;
  productId: string;
  productName: string;
  quantity: number;
  unitOfMeasurement: TypeUnitOfMeasurement;
  unitCostSnapshot: number | null;
  totalCost: number;
  reason: TypeStockMovementReason;
  reasonDescription: string | null;
};

export interface StockMovementRepository extends BaseRepository<StockMovement> {
  sumUnitCostByCompanyAndDateAndReason(
    companyId: string,
    dateFrom: Date,
    dateTo: Date,
    reasons: TypeStockMovementReason[],
  ): Promise<number>;

  findAllByCompanyAndDateAndReason(
    companyId: string,
    dateFrom: Date,
    dateTo: Date,
    reasons: TypeStockMovementReason[],
  ): Promise<StockMovementReportItem[]>;
}
