import { Company } from '@/core/company/domain/entities/company.entity';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-field';
import { TypeCashRegisterSessionStatus } from '@/shared/infra/enums/cash-register';
import {
  IsDate,
  IsEnum,
  IsInstance,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CashRegisterSessionProps } from '../entities/cash-register-session.entity';

export class CashRegisterSessionRules {
  @IsOptional()
  @IsInstance(Company)
  company: Company | null;

  @IsEnum(TypeCashRegisterSessionStatus)
  status: TypeCashRegisterSessionStatus;

  @IsNumber()
  @Min(0)
  openingAmount: number;

  @IsDate()
  openedAt: Date;

  @IsString()
  @IsNotEmpty()
  openedBy: string;

  @IsOptional()
  @IsDate()
  closedAt: Date | null;

  @IsOptional()
  @IsString()
  closedBy: string | null;

  @IsOptional()
  @IsNumber()
  totalCash: number | null;

  @IsOptional()
  @IsNumber()
  totalPix: number | null;

  @IsOptional()
  @IsNumber()
  totalCard: number | null;

  @IsString()
  @IsNotEmpty()
  createdBy: string;

  @IsString()
  @IsNotEmpty()
  updatedBy: string;

  @IsOptional()
  deletedBy?: string | null;

  constructor(data: CashRegisterSessionProps) {
    Object.assign(this, data);
  }
}

export class CashRegisterSessionValidator extends ClassValidatorFields<CashRegisterSessionRules> {
  validate(data: CashRegisterSessionProps): boolean {
    return super.validate(new CashRegisterSessionRules(data ?? {}));
  }
}

export class CashRegisterSessionValidatorFactory {
  static create(): CashRegisterSessionValidator {
    return new CashRegisterSessionValidator();
  }
}
