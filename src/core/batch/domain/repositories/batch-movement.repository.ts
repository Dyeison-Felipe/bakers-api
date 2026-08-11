import { BaseRepository } from '@/shared/domain/repository/base-repository';
import { TypeBatchMovementReason } from '@/shared/infra/enums/batch';
import { BatchMovement } from '../entities/batch-movement.entity';

export interface BatchMovementRepository extends BaseRepository<BatchMovement> {
  findAllByBatchId(batchId: string): Promise<BatchMovement[]>;

  sumUnitCostByCompanyAndDateAndReason(
    companyId: string,
    dateFrom: Date,
    dateTo: Date,
    reasons: TypeBatchMovementReason[],
  ): Promise<number>;
}
