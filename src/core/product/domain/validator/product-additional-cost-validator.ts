// core/product/domain/validator/product-additional-cost-validator.ts
import {
  IsInstance,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-field';
import { Product } from '../entities/product.entity';
import { AdditionalCost } from '@/core/additional-cost/domain/entities/additional-cost.entity';
import { ProductAdditionalCostProps } from '../entities/product-additional-cost.entity';

export class ProductAdditionalCostRules {
  @IsOptional()
  @IsInstance(Product)
  product: Product;

  @IsOptional()
  @IsInstance(AdditionalCost)
  additionalCost: AdditionalCost;

  @IsOptional()
  @IsNumber()
  @Min(0)
  value: number;

  constructor(data: ProductAdditionalCostProps) {
    Object.assign(this, data);
  }
}

export class ProductAdditionalCostValidator extends ClassValidatorFields<ProductAdditionalCostRules> {
  validate(data: ProductAdditionalCostProps): boolean {
    return super.validate(new ProductAdditionalCostRules(data ?? {}));
  }
}

export class ProductAdditionalCostValidatorFactory {
  static create(): ProductAdditionalCostValidator {
    return new ProductAdditionalCostValidator();
  }
}