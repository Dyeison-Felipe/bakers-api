import { BaseRepository } from '@/shared/domain/repository/base-repository';
import { TypeBatchMovementReason } from '@/shared/infra/enums/batch';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { BatchMovement } from '../entities/batch-movement.entity';

export type BatchMovementReportItem = {
  id: string;
  createdAt: Date;
  productId: string;
  productName: string;
  quantity: number;
  unitOfMeasurement: TypeUnitOfMeasurement;
  unitCostSnapshot: number | null;
  totalCost: number;
  reason: TypeBatchMovementReason;
  reasonDescription: string | null;
};

export interface BatchMovementRepository extends BaseRepository<BatchMovement> {
  findAllByBatchId(batchId: string): Promise<BatchMovement[]>;

  sumUnitCostByCompanyAndDateAndReason(
    companyId: string,
    dateFrom: Date,
    dateTo: Date,
    reasons: TypeBatchMovementReason[],
  ): Promise<number>;

  findAllByCompanyAndDateAndReason(
    companyId: string,
    dateFrom: Date,
    dateTo: Date,
    reasons: TypeBatchMovementReason[],
  ): Promise<BatchMovementReportItem[]>;
}
