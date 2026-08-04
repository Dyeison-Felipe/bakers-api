import { Company } from '@/core/company/domain/entities/company.entity';
import { CashRegisterSession } from '@/core/cash-register/domain/entities/cash-register-session.entity';
import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-field';
import { TypePaymentMethod, TypeSaleStatus } from '@/shared/infra/enums/sale';
import {
  IsEnum,
  IsInstance,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { SaleProps } from '../entities/sale.entity';

export class SaleRules {
  @IsOptional()
  @IsInstance(Company)
  company: Company | null;

  @IsOptional()
  @IsInstance(CashRegisterSession)
  cashRegisterSession: CashRegisterSession | null;

  @IsEnum(TypeSaleStatus)
  status: TypeSaleStatus;

  @IsEnum(TypePaymentMethod)
  paymentMethod: TypePaymentMethod;

  @IsNumber()
  @Min(0.01)
  totalAmount: number;

  @IsOptional()
  @IsNumber()
  amountReceived: number | null;

  @IsOptional()
  @IsNumber()
  changeAmount: number | null;

  @IsOptional()
  @IsString()
  @Length(11, 11)
  customerCpf: string | null;

  @IsOptional()
  @IsString()
  receiptPdfPath: string | null;

  @IsString()
  @IsNotEmpty()
  soldBy: string;

  @IsString()
  @IsNotEmpty()
  createdBy: string;

  @IsString()
  @IsNotEmpty()
  updatedBy: string;

  @IsOptional()
  deletedBy?: string | null;

  constructor(data: SaleProps) {
    Object.assign(this, data);
  }
}

export class SaleValidator extends ClassValidatorFields<SaleRules> {
  validate(data: SaleProps): boolean {
    return super.validate(new SaleRules(data ?? {}));
  }
}

export class SaleValidatorFactory {
  static create(): SaleValidator {
    return new SaleValidator();
  }
}
