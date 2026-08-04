import { BaseRepository } from '@/shared/domain/repository/base-repository';
import { BatchMovement } from '../entities/batch-movement.entity';

export interface BatchMovementRepository extends BaseRepository<BatchMovement> {
  findAllByBatchId(batchId: string): Promise<BatchMovement[]>;
}
