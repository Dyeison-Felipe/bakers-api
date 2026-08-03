import { Data } from '@/shared/domain/decorators/data.decorator';
import { BaseEntity } from '@/shared/domain/entity/base-entity';
import { Product } from './product.entity';
import { ProductRecipeItemValidatorFactory } from '../validator/product-recipe-item-validator';
import { EntityValidationError } from '@/shared/application/errors/validation-error';

export type ProductRecipeItemProps = {
  product: Product;
  material: Product;
  quantity: number;
};

export type CreateProductRecipeItemProps = {
  product: Product;
  material: Product;
  quantity: number;
};

export interface ProductRecipeItem extends ProductRecipeItemProps {}

@Data()
export class ProductRecipeItem extends BaseEntity<ProductRecipeItemProps> {
  protected validate(): void {
    const validator = ProductRecipeItemValidatorFactory.create();

    const isValid = validator.validate(this.props);
    if (!isValid) {
      throw new EntityValidationError(validator.errors);
    }
  }

  static create(props: CreateProductRecipeItemProps): ProductRecipeItem {
    return new ProductRecipeItem({
      id: crypto.randomUUID(),
      product: props.product,
      material: props.material,
      quantity: props.quantity,
    });
  }

  updateQuantity(quantity: number): void {
    this.quantity = quantity;
  }
}
