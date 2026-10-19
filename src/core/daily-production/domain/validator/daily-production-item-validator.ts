import { Product } from '@/core/product/domain/entities/product.entity';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-field';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { TypeDailyProductionItemStatus } from '@/shared/infra/enums/daily-production';
import {
  IsDate,
  IsEnum,
  IsInstance,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { MONEY_MAX, QUANTITY_MAX, UNIT_COST_MAX } from '@/shared/domain/constants/field-limits';
import { DailyProductionItemProps } from '../entities/daily-production-item.entity';
import { DailyProduction } from '../entities/daily-production.entity';

export class DailyProductionItemRules {
  @IsOptional()
  @IsInstance(DailyProduction)
  dailyProduction: DailyProduction | null;

  @IsOptional()
  @IsInstance(Product)
  product: Product | null;

  @IsEnum(TypeUnitOfMeasurement)
  unitOfMeasurement: TypeUnitOfMeasurement;

  @IsOptional()
  @IsNumber()
  @Min(0.001)
  @Max(QUANTITY_MAX)
  plannedQuantity: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0.001)
  @Max(QUANTITY_MAX)
  recipeMultiplier: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0.001)
  @Max(QUANTITY_MAX)
  plannedWeight: number | null;

  @IsOptional()
  @IsNumber()
  @Max(UNIT_COST_MAX)
  unitCostPriceSnapshot: number | null;

  @IsOptional()
  @IsNumber()
  @Max(MONEY_MAX)
  pricePerKilogramSnapshot: number | null;

  @IsNumber()
  @Min(0)
  @Max(MONEY_MAX)
  plannedCost: number;

  @IsEnum(TypeDailyProductionItemStatus)
  status: TypeDailyProductionItemStatus;

  @IsOptional()
  @IsNumber()
  @Max(QUANTITY_MAX)
  actualQuantity: number | null;

  @IsOptional()
  @IsNumber()
  @Max(QUANTITY_MAX)
  actualWeight: number | null;

  @IsOptional()
  @IsDate()
  producedAt: Date | null;

  @IsOptional()
  @IsString()
  producedBy: string | null;

  @IsString()
  @IsNotEmpty()
  createdBy: string;

  @IsString()
  @IsNotEmpty()
  updatedBy: string;

  @IsOptional()
  deletedBy?: string | null;

  constructor(data: DailyProductionItemProps) {
    Object.assign(this, data);
  }
}

export class DailyProductionItemValidator extends ClassValidatorFields<DailyProductionItemRules> {
  validate(data: DailyProductionItemProps): boolean {
    return super.validate(new DailyProductionItemRules(data ?? {}));
  }
}

export class DailyProductionItemValidatorFactory {
  static create(): DailyProductionItemValidator {
    return new DailyProductionItemValidator();
  }
}
