import { Data } from '@/shared/domain/decorators/data.decorator';
import { BaseEntity } from '@/shared/domain/entity/base-entity';
import { EntityValidationError } from '@/shared/application/errors/validation-error';
import {
  TypeStockMovement,
  TypeStockMovementReason,
} from '@/shared/infra/enums/stock-movement';
import { StockMovementValidatorFactory } from '../validator/stock-movement-validator';

export type StockMovementProps = {
  productId: string;
  type: TypeStockMovement;
  quantity: number;
  reason: TypeStockMovementReason;
  reasonDescription: string | null;
  unitCostSnapshot: number | null;
  createdBy: string;
};

export interface StockMovement extends StockMovementProps {}

// Ledger de movimentações de estoque direto no produto (sem lote/validade/
// FEFO) — substitui BatchMovement. Registro imutável (ver repositório).
@Data()
export class StockMovement extends BaseEntity<StockMovementProps> {
  protected validate(): void {
    const validator = StockMovementValidatorFactory.create();

    const isValid = validator.validate(this.props);
    if (!isValid) {
      throw new EntityValidationError(validator.errors);
    }
  }

  static create(props: StockMovementProps): StockMovement {
    return new StockMovement({
      id: crypto.randomUUID(),
      productId: props.productId,
      type: props.type,
      quantity: props.quantity,
      reason: props.reason,
      reasonDescription: props.reasonDescription,
      unitCostSnapshot: props.unitCostSnapshot,
      createdBy: props.createdBy,
    });
  }
}
