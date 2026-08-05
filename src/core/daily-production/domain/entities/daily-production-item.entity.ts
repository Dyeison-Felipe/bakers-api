import { Product } from '@/core/product/domain/entities/product.entity';
import { Data } from '@/shared/domain/decorators/data.decorator';
import { BaseEntity } from '@/shared/domain/entity/base-entity';
import { EntityValidationError } from '@/shared/application/errors/validation-error';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { TypeDailyProductionItemStatus } from '@/shared/infra/enums/daily-production';
import { DailyProductionItemValidatorFactory } from '../validator/daily-production-item-validator';
import { DailyProduction } from './daily-production.entity';

export type DailyProductionItemProps = {
  dailyProduction: DailyProduction | null;
  product: Product | null;
  unitOfMeasurement: TypeUnitOfMeasurement;
  plannedQuantity: number | null;
  recipeMultiplier: number | null;
  plannedWeight: number | null;
  unitCostPriceSnapshot: number | null;
  pricePerKilogramSnapshot: number | null;
  plannedCost: number;
  status: TypeDailyProductionItemStatus;
  actualQuantity: number | null;
  actualWeight: number | null;
  producedAt: Date | null;
  producedBy: string | null;
  createdBy: string;
  updatedBy: string;
  deletedBy?: string | null;
};

type CreateDailyProductionItemProps = {
  dailyProduction: DailyProduction;
  product: Product;
  unitOfMeasurement: TypeUnitOfMeasurement;
  plannedQuantity: number | null;
  recipeMultiplier: number | null;
  plannedWeight: number | null;
  unitCostPriceSnapshot: number | null;
  pricePerKilogramSnapshot: number | null;
  plannedCost: number;
  createdBy: string;
};

type MarkAsProducedProps = {
  actualQuantity: number | null;
  actualWeight: number | null;
  producedBy: string;
};

type UpdatePlannedProps = {
  plannedQuantity: number | null;
  recipeMultiplier: number | null;
  plannedWeight: number | null;
  plannedCost: number;
  updatedBy: string;
};

export interface DailyProductionItem extends DailyProductionItemProps {}

@Data()
export class DailyProductionItem extends BaseEntity<DailyProductionItemProps> {
  protected validate(): void {
    const validator = DailyProductionItemValidatorFactory.create();

    const isValid = validator.validate(this.props);
    if (!isValid) {
      throw new EntityValidationError(validator.errors);
    }
  }

  static create(props: CreateDailyProductionItemProps): DailyProductionItem {
    return new DailyProductionItem({
      id: crypto.randomUUID(),
      dailyProduction: props.dailyProduction,
      product: props.product,
      unitOfMeasurement: props.unitOfMeasurement,
      plannedQuantity: props.plannedQuantity,
      recipeMultiplier: props.recipeMultiplier,
      plannedWeight: props.plannedWeight,
      unitCostPriceSnapshot: props.unitCostPriceSnapshot,
      pricePerKilogramSnapshot: props.pricePerKilogramSnapshot,
      plannedCost: props.plannedCost,
      status: TypeDailyProductionItemStatus.PLANNED,
      actualQuantity: null,
      actualWeight: null,
      producedAt: null,
      producedBy: null,
      createdBy: props.createdBy,
      updatedBy: props.createdBy,
      deletedBy: null,
    });
  }

  markAsProduced(props: MarkAsProducedProps): void {
    this.status = TypeDailyProductionItemStatus.PRODUCED;
    this.actualQuantity = props.actualQuantity;
    this.actualWeight = props.actualWeight;
    this.producedAt = new Date();
    this.producedBy = props.producedBy;
    this.updatedBy = props.producedBy;
    this.updateTimestamp();
  }

  updatePlanned(props: UpdatePlannedProps): void {
    this.plannedQuantity = props.plannedQuantity;
    this.recipeMultiplier = props.recipeMultiplier;
    this.plannedWeight = props.plannedWeight;
    this.plannedCost = props.plannedCost;
    this.updatedBy = props.updatedBy;
    this.updateTimestamp();
  }

  cancel(updatedBy: string): void {
    this.status = TypeDailyProductionItemStatus.CANCELLED;
    this.updatedBy = updatedBy;
    this.updateTimestamp();
  }
}
