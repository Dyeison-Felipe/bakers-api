import { Company } from '@/core/company/domain/entities/company.entity';
import { CashRegisterSession } from '@/core/cash-register/domain/entities/cash-register-session.entity';
import { Data } from '@/shared/domain/decorators/data.decorator';
import { BaseEntity } from '@/shared/domain/entity/base-entity';
import { EntityValidationError } from '@/shared/application/errors/validation-error';
import { TypePaymentMethod, TypeSaleStatus } from '@/shared/infra/enums/sale';
import { SaleValidatorFactory } from '../validator/sale-validator';

export type SaleProps = {
  company: Company | null;
  cashRegisterSession: CashRegisterSession | null;
  status: TypeSaleStatus;
  paymentMethod: TypePaymentMethod;
  totalAmount: number;
  amountReceived: number | null;
  changeAmount: number | null;
  customerCpf: string | null;
  customerId: string | null;
  receiptPdfPath: string | null;
  soldBy: string;
  createdBy: string;
  updatedBy: string;
  deletedBy?: string | null;
};

type CreateSaleProps = {
  company: Company;
  cashRegisterSession: CashRegisterSession;
  paymentMethod: TypePaymentMethod;
  totalAmount: number;
  amountReceived: number | null;
  changeAmount: number | null;
  customerCpf: string | null;
  customerId: string | null;
  soldBy: string;
};

export interface Sale extends SaleProps {}

@Data()
export class Sale extends BaseEntity<SaleProps> {
  protected validate(): void {
    const validator = SaleValidatorFactory.create();

    const isValid = validator.validate(this.props);
    if (!isValid) {
      throw new EntityValidationError(validator.errors);
    }
  }

  static create(props: CreateSaleProps): Sale {
    return new Sale({
      id: crypto.randomUUID(),
      company: props.company,
      cashRegisterSession: props.cashRegisterSession,
      status: TypeSaleStatus.COMPLETED,
      paymentMethod: props.paymentMethod,
      totalAmount: props.totalAmount,
      amountReceived: props.amountReceived,
      changeAmount: props.changeAmount,
      customerCpf: props.customerCpf,
      customerId: props.customerId,
      receiptPdfPath: null,
      soldBy: props.soldBy,
      createdBy: props.soldBy,
      updatedBy: props.soldBy,
      deletedBy: null,
    });
  }

  attachReceipt(receiptPdfPath: string, updatedBy: string): void {
    this.receiptPdfPath = receiptPdfPath;
    this.updatedBy = updatedBy;
    this.updateTimestamp();
  }
}
