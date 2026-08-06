import { IsInstance, IsOptional } from 'class-validator';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-field';
import { Product } from '../entities/product.entity';
import { Recipe } from '@/core/recipe/domain/entities/recipe.entity';
import { ProductRecipeLinkProps } from '../entities/product-recipe-link.entity';

export class ProductRecipeLinkRules {
  @IsOptional()
  @IsInstance(Product)
  product: Product;

  @IsOptional()
  @IsInstance(Recipe)
  recipe: Recipe;

  constructor(data: ProductRecipeLinkProps) {
    Object.assign(this, data);
  }
}

export class ProductRecipeLinkValidator extends ClassValidatorFields<ProductRecipeLinkRules> {
  validate(data: ProductRecipeLinkProps): boolean {
    return super.validate(new ProductRecipeLinkRules(data ?? {}));
  }
}

export class ProductRecipeLinkValidatorFactory {
  static create(): ProductRecipeLinkValidator {
    return new ProductRecipeLinkValidator();
  }
}
