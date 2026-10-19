import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-field';
import {
  TypeStockMovement,
  TypeStockMovementReason,
} from '@/shared/infra/enums/stock-movement';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { QUANTITY_MAX, UNIT_COST_MAX } from '@/shared/domain/constants/field-limits';
import { StockMovementProps } from '../entities/stock-movement.entity';

export class StockMovementRules {
  @IsUUID()
  productId: string;

  @IsEnum(TypeStockMovement)
  type: TypeStockMovement;

  @IsNumber()
  @Min(0.001)
  @Max(QUANTITY_MAX)
  quantity: number;

  @IsEnum(TypeStockMovementReason)
  reason: TypeStockMovementReason;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonDescription: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(UNIT_COST_MAX)
  unitCostSnapshot: number | null;

  @IsString()
  @IsNotEmpty()
  createdBy: string;

  constructor(data: StockMovementProps) {
    Object.assign(this, data);
  }
}

export class StockMovementValidator extends ClassValidatorFields<StockMovementRules> {
  validate(data: StockMovementProps): boolean {
    return super.validate(new StockMovementRules(data ?? {}));
  }
}

export class StockMovementValidatorFactory {
  static create(): StockMovementValidator {
    return new StockMovementValidator();
  }
}
