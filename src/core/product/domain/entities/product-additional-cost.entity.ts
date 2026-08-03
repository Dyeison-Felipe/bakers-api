// core/product/domain/entities/product-additional-cost.entity.ts
import { Data } from '@/shared/domain/decorators/data.decorator';
import { BaseEntity } from '@/shared/domain/entity/base-entity';
import { Product } from './product.entity';
import { AdditionalCost } from '@/core/additional-cost/domain/entities/additional-cost.entity';
import { EntityValidationError } from '@/shared/application/errors/validation-error';
import { ProductAdditionalCostValidatorFactory } from '../validator/product-additional-cost-validator';

export type ProductAdditionalCostProps = {
  product: Product;
  additionalCost: AdditionalCost;
  value: number;
};

export type CreateProductAdditionalCostProps = {
  product: Product;
  additionalCost: AdditionalCost;
  value: number;
};

export interface ProductAdditionalCost extends ProductAdditionalCostProps {}

@Data()
export class ProductAdditionalCost extends BaseEntity<ProductAdditionalCostProps> {
  protected validate(): void {
    const validator = ProductAdditionalCostValidatorFactory.create();

    const isValid = validator.validate(this.props);
    if (!isValid) {
      throw new EntityValidationError(validator.errors);
    }
  }

  static create(props: CreateProductAdditionalCostProps): ProductAdditionalCost {
    return new ProductAdditionalCost({
      id: crypto.randomUUID(),
      product: props.product,
      additionalCost: props.additionalCost,
      value: props.value,
    });
  }

  updateValue(value: number): void {
    this.value = value;
  }
}