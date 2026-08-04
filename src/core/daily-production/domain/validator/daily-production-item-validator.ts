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
  Min,
} from 'class-validator';
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
  plannedQuantity: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0.001)
  recipeMultiplier: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0.001)
  plannedWeight: number | null;

  @IsOptional()
  @IsNumber()
  unitCostPriceSnapshot: number | null;

  @IsOptional()
  @IsNumber()
  pricePerKilogramSnapshot: number | null;

  @IsNumber()
  @Min(0)
  plannedCost: number;

  @IsEnum(TypeDailyProductionItemStatus)
  status: TypeDailyProductionItemStatus;

  @IsOptional()
  @IsNumber()
  actualQuantity: number | null;

  @IsOptional()
  @IsNumber()
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
