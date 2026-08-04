import { Data } from '@/shared/domain/decorators/data.decorator';
import { BaseEntity } from '@/shared/domain/entity/base-entity';
import { EntityValidationError } from '@/shared/application/errors/validation-error';
import {
  TypeBatchMovement,
  TypeBatchMovementReason,
} from '@/shared/infra/enums/batch';
import { BatchMovementValidatorFactory } from '../validator/batch-movement-validator';

export type BatchMovementProps = {
  batchId: string;
  type: TypeBatchMovement;
  quantity: number;
  reason: TypeBatchMovementReason;
  reasonDescription: string | null;
  createdBy: string;
};

export interface BatchMovement extends BatchMovementProps {}

@Data()
export class BatchMovement extends BaseEntity<BatchMovementProps> {
  protected validate(): void {
    const validator = BatchMovementValidatorFactory.create();

    const isValid = validator.validate(this.props);
    if (!isValid) {
      throw new EntityValidationError(validator.errors);
    }
  }

  static create(props: BatchMovementProps): BatchMovement {
    return new BatchMovement({
      id: crypto.randomUUID(),
      batchId: props.batchId,
      type: props.type,
      quantity: props.quantity,
      reason: props.reason,
      reasonDescription: props.reasonDescription,
      createdBy: props.createdBy,
    });
  }
}
