import { Data } from '@/shared/domain/decorators/data.decorator';
import { BaseEntity } from '@/shared/domain/entity/base-entity';
import { EntityValidationError } from '@/shared/application/errors/validation-error';
import {
  TypeCashRegisterMovement,
  TypeCashRegisterMovementReason,
} from '@/shared/infra/enums/cash-register';
import { CashRegisterMovementValidatorFactory } from '../validator/cash-register-movement-validator';
import { CashRegisterSession } from './cash-register-session.entity';

export type CashRegisterMovementProps = {
  cashRegisterSession: CashRegisterSession | null;
  type: TypeCashRegisterMovement;
  reason: TypeCashRegisterMovementReason;
  description: string | null;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  createdBy: string;
};

type CreateCashRegisterMovementProps = {
  cashRegisterSession: CashRegisterSession;
  type: TypeCashRegisterMovement;
  reason: TypeCashRegisterMovementReason;
  description: string | null;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  createdBy: string;
};

export interface CashRegisterMovement extends CashRegisterMovementProps {}

@Data()
export class CashRegisterMovement extends BaseEntity<CashRegisterMovementProps> {
  protected validate(): void {
    const validator = CashRegisterMovementValidatorFactory.create();

    const isValid = validator.validate(this.props);
    if (!isValid) {
      throw new EntityValidationError(validator.errors);
    }
  }

  static create(props: CreateCashRegisterMovementProps): CashRegisterMovement {
    return new CashRegisterMovement({
      id: crypto.randomUUID(),
      cashRegisterSession: props.cashRegisterSession,
      type: props.type,
      reason: props.reason,
      description: props.description,
      amount: props.amount,
      balanceBefore: props.balanceBefore,
      balanceAfter: props.balanceAfter,
      createdBy: props.createdBy,
    });
  }
}
