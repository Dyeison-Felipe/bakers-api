import { Product } from '@/core/product/domain/entities/product.entity';
import { Data } from '@/shared/domain/decorators/data.decorator';
import { BaseEntity } from '@/shared/domain/entity/base-entity';
import { EntityValidationError } from '@/shared/application/errors/validation-error';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { SaleItemValidatorFactory } from '../validator/sale-item-validator';
import { Sale } from './sale.entity';

export type SaleItemProps = {
  sale: Sale | null;
  product: Product | null;
  productNameSnapshot: string;
  unitOfMeasurement: TypeUnitOfMeasurement;
  quantity: number | null;
  weightInKg: number | null;
  unitPriceSnapshot: number;
  subtotal: number;
  createdBy: string;
  updatedBy: string;
  deletedBy?: string | null;
};

type CreateSaleItemProps = {
  sale: Sale;
  product: Product;
  productNameSnapshot: string;
  unitOfMeasurement: TypeUnitOfMeasurement;
  quantity: number | null;
  weightInKg: number | null;
  unitPriceSnapshot: number;
  subtotal: number;
  createdBy: string;
};

export interface SaleItem extends SaleItemProps {}

@Data()
export class SaleItem extends BaseEntity<SaleItemProps> {
  protected validate(): void {
    const validator = SaleItemValidatorFactory.create();

    const isValid = validator.validate(this.props);
    if (!isValid) {
      throw new EntityValidationError(validator.errors);
    }
  }

  static create(props: CreateSaleItemProps): SaleItem {
    return new SaleItem({
      id: crypto.randomUUID(),
      sale: props.sale,
      product: props.product,
      productNameSnapshot: props.productNameSnapshot,
      unitOfMeasurement: props.unitOfMeasurement,
      quantity: props.quantity,
      weightInKg: props.weightInKg,
      unitPriceSnapshot: props.unitPriceSnapshot,
      subtotal: props.subtotal,
      createdBy: props.createdBy,
      updatedBy: props.createdBy,
      deletedBy: null,
    });
  }
}
