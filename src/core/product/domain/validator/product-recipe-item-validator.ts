import {
  IsBoolean,
  IsEnum,
  IsInstance,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-field';
import { Product, ProductProps } from '../entities/product.entity';
import {
  TypeConsumptionUnit,
  TypeProduct,
  TypeUnitOfMeasurement,
  TypeUnitOfPurchase,
} from '@/shared/infra/enums/product';
import { Category } from '@/core/category/domain/entities/category.entity';
import { Company } from '@/core/company/domain/entities/company.entity';
import { ProductRecipeItemProps } from '../entities/product-recipe-item.entity';

export class ProductRecipeItemRules {
  @IsOptional()
  @IsInstance(Product)
  product: Product;

  @IsOptional()
  @IsInstance(Product)
  material: Product;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity: number | null;

  constructor(data: ProductRecipeItemProps) {
    Object.assign(this, data);
  }
}

export class ProductRecipeItemValidator extends ClassValidatorFields<ProductRecipeItemRules> {
  validate(data: ProductRecipeItemProps): boolean {
    return super.validate(new ProductRecipeItemRules(data ?? {}));
  }
}

export class ProductRecipeItemValidatorFactory {
  static create(): ProductRecipeItemValidator {
    return new ProductRecipeItemValidator();
  }
}
