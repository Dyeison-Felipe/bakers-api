import { Product } from '@/core/product/domain/entities/product.entity';
import { Company } from '@/core/company/domain/entities/company.entity';
import { Data } from '@/shared/domain/decorators/data.decorator';
import { BaseEntity } from '@/shared/domain/entity/base-entity';
import { EntityValidationError } from '@/shared/application/errors/validation-error';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { BatchValidatorFactory } from '../validator/batch-validator';

export type BatchProps = {
  product: Product | null;
  company: Company | null;
  dailyProductionItemId: string | null;
  quantity: number;
  remainingQuantity: number;
  unitOfMeasurement: TypeUnitOfMeasurement;
  productionDate: Date;
  expirationDate: Date | null;
  createdBy: string;
  updatedBy: string;
  deletedBy?: string | null;
};

type CreateBatchProps = {
  product: Product;
  company: Company;
  dailyProductionItemId: string | null;
  quantity: number;
  unitOfMeasurement: TypeUnitOfMeasurement;
  productionDate: Date;
  expirationDate: Date | null;
  createdBy: string;
};

export interface Batch extends BatchProps {}

@Data()
export class Batch extends BaseEntity<BatchProps> {
  protected validate(): void {
    const validator = BatchValidatorFactory.create();

    const isValid = validator.validate(this.props);
    if (!isValid) {
      throw new EntityValidationError(validator.errors);
    }
  }

  static create(props: CreateBatchProps): Batch {
    return new Batch({
      id: crypto.randomUUID(),
      product: props.product,
      company: props.company,
      dailyProductionItemId: props.dailyProductionItemId,
      quantity: props.quantity,
      remainingQuantity: props.quantity,
      unitOfMeasurement: props.unitOfMeasurement,
      productionDate: props.productionDate,
      expirationDate: props.expirationDate,
      createdBy: props.createdBy,
      updatedBy: props.createdBy,
      deletedBy: null,
    });
  }

  applyCorrection(
    quantity: number,
    remainingQuantity: number,
    expirationDate: Date | null,
    updatedBy: string,
  ): void {
    this.quantity = quantity;
    this.remainingQuantity = remainingQuantity;
    this.expirationDate = expirationDate;
    this.updatedBy = updatedBy;
    this.updateTimestamp();
  }

  consume(quantity: number, updatedBy: string): void {
    this.remainingQuantity = this.remainingQuantity - quantity;
    this.updatedBy = updatedBy;
    this.updateTimestamp();
  }
}
