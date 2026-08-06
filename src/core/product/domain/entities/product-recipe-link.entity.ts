// core/product/domain/entities/product-recipe-link.entity.ts
import { Data } from '@/shared/domain/decorators/data.decorator';
import { BaseEntity } from '@/shared/domain/entity/base-entity';
import { Product } from './product.entity';
import { Recipe } from '@/core/recipe/domain/entities/recipe.entity';
import { EntityValidationError } from '@/shared/application/errors/validation-error';
import { ProductRecipeLinkValidatorFactory } from '../validator/product-recipe-link-validator';

export type ProductRecipeLinkProps = {
  product: Product;
  recipe: Recipe;
};

export type CreateProductRecipeLinkProps = {
  product: Product;
  recipe: Recipe;
};

export interface ProductRecipeLink extends ProductRecipeLinkProps {}

@Data()
export class ProductRecipeLink extends BaseEntity<ProductRecipeLinkProps> {
  protected validate(): void {
    const validator = ProductRecipeLinkValidatorFactory.create();

    const isValid = validator.validate(this.props);
    if (!isValid) {
      throw new EntityValidationError(validator.errors);
    }
  }

  static create(props: CreateProductRecipeLinkProps): ProductRecipeLink {
    return new ProductRecipeLink({
      id: crypto.randomUUID(),
      product: props.product,
      recipe: props.recipe,
    });
  }
}
