import { Product } from '@/core/product/domain/entities/product.entity';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-field';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import {
  IsEnum,
  IsInstance,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { MONEY_MAX, QUANTITY_MAX } from '@/shared/domain/constants/field-limits';
import { SaleItemProps } from '../entities/sale-item.entity';
import { Sale } from '../entities/sale.entity';

export class SaleItemRules {
  @IsOptional()
  @IsInstance(Sale)
  sale: Sale | null;

  @IsOptional()
  @IsInstance(Product)
  product: Product | null;

  @IsString()
  @IsNotEmpty()
  productNameSnapshot: string;

  @IsEnum(TypeUnitOfMeasurement)
  unitOfMeasurement: TypeUnitOfMeasurement;

  @IsOptional()
  @IsNumber()
  @Min(0.001)
  @Max(QUANTITY_MAX)
  quantity: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0.001)
  @Max(QUANTITY_MAX)
  weightInKg: number | null;

  @IsNumber()
  @Min(0)
  @Max(MONEY_MAX)
  unitPriceSnapshot: number;

  @IsNumber()
  @Min(0)
  @Max(MONEY_MAX)
  unitCostSnapshot: number;

  @IsNumber()
  @Min(0)
  @Max(MONEY_MAX)
  subtotal: number;

  @IsString()
  @IsNotEmpty()
  createdBy: string;

  @IsString()
  @IsNotEmpty()
  updatedBy: string;

  @IsOptional()
  deletedBy?: string | null;

  constructor(data: SaleItemProps) {
    Object.assign(this, data);
  }
}

export class SaleItemValidator extends ClassValidatorFields<SaleItemRules> {
  validate(data: SaleItemProps): boolean {
    return super.validate(new SaleItemRules(data ?? {}));
  }
}

export class SaleItemValidatorFactory {
  static create(): SaleItemValidator {
    return new SaleItemValidator();
  }
}
