import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-field';
import {
  IsEnum,
  IsInstance,
  IsNumber,
  IsOptional,
  IsString,
  IsNotEmpty,
  MaxLength,
  Min,
} from 'class-validator';
import {
  TypeCashRegisterMovement,
  TypeCashRegisterMovementReason,
} from '@/shared/infra/enums/cash-register';
import { CashRegisterSession } from '../entities/cash-register-session.entity';
import { CashRegisterMovementProps } from '../entities/cash-register-movement.entity';

export class CashRegisterMovementRules {
  @IsOptional()
  @IsInstance(CashRegisterSession)
  cashRegisterSession: CashRegisterSession | null;

  @IsEnum(TypeCashRegisterMovement)
  type: TypeCashRegisterMovement;

  @IsEnum(TypeCashRegisterMovementReason)
  reason: TypeCashRegisterMovementReason;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description: string | null;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsNumber()
  balanceBefore: number;

  @IsNumber()
  @Min(0)
  balanceAfter: number;

  @IsString()
  @IsNotEmpty()
  createdBy: string;

  constructor(data: CashRegisterMovementProps) {
    Object.assign(this, data);
  }
}

export class CashRegisterMovementValidator extends ClassValidatorFields<CashRegisterMovementRules> {
  validate(data: CashRegisterMovementProps): boolean {
    return super.validate(new CashRegisterMovementRules(data ?? {}));
  }
}

export class CashRegisterMovementValidatorFactory {
  static create(): CashRegisterMovementValidator {
    return new CashRegisterMovementValidator();
  }
}
