import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-field';
import {
  TypeBatchMovement,
  TypeBatchMovementReason,
} from '@/shared/infra/enums/batch';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { BatchMovementProps } from '../entities/batch-movement.entity';

export class BatchMovementRules {
  @IsUUID()
  batchId: string;

  @IsEnum(TypeBatchMovement)
  type: TypeBatchMovement;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsEnum(TypeBatchMovementReason)
  reason: TypeBatchMovementReason;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonDescription: string | null;

  @IsString()
  @IsNotEmpty()
  createdBy: string;

  constructor(data: BatchMovementProps) {
    Object.assign(this, data);
  }
}

export class BatchMovementValidator extends ClassValidatorFields<BatchMovementRules> {
  validate(data: BatchMovementProps): boolean {
    return super.validate(new BatchMovementRules(data ?? {}));
  }
}

export class BatchMovementValidatorFactory {
  static create(): BatchMovementValidator {
    return new BatchMovementValidator();
  }
}
