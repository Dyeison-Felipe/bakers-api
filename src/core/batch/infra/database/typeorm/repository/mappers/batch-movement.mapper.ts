import { BatchMovement } from '@/core/batch/domain/entities/batch-movement.entity';
import { BatchSchema } from '../../schema/batch.schema';
import { BatchMovementSchema } from '../../schema/batch-movement.schema';

export class BatchMovementMapper {
  static toEntity(schema: BatchMovementSchema): BatchMovement {
    return new BatchMovement({
      id: schema.id,
      batchId: schema.batch.id,
      type: schema.type,
      quantity: schema.quantity,
      reason: schema.reason,
      reasonDescription: schema.reasonDescription,
      unitCostSnapshot: schema.unitCostSnapshot,
      createdBy: schema.createdBy,
      auditable: {
        createdAt: schema.createdAt,
        updatedAt: schema.updatedAt,
        deletedAt: schema.deletedAt,
      },
    });
  }

  static toSchema(entity: BatchMovement): BatchMovementSchema {
    return BatchMovementSchema.with({
      id: entity.id,
      batch: { id: entity.batchId } as BatchSchema,
      type: entity.type,
      quantity: entity.quantity,
      reason: entity.reason,
      reasonDescription: entity.reasonDescription,
      unitCostSnapshot: entity.unitCostSnapshot,
      createdBy: entity.createdBy,
      createdAt: entity.auditable?.createdAt,
    });
  }
}
