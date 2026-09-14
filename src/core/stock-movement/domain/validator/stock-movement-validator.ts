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
  MaxLength,
  Min,
} from 'class-validator';
import { StockMovementProps } from '../entities/stock-movement.entity';

export class StockMovementRules {
  @IsUUID()
  productId: string;

  @IsEnum(TypeStockMovement)
  type: TypeStockMovement;

  @IsNumber()
  @Min(0.001)
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
