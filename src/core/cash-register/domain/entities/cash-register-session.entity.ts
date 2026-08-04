import { Company } from '@/core/company/domain/entities/company.entity';
import { Data } from '@/shared/domain/decorators/data.decorator';
import { BaseEntity } from '@/shared/domain/entity/base-entity';
import { EntityValidationError } from '@/shared/application/errors/validation-error';
import { TypeCashRegisterSessionStatus } from '@/shared/infra/enums/cash-register';
import { CashRegisterSessionValidatorFactory } from '../validator/cash-register-session-validator';

export type CashRegisterSessionProps = {
  company: Company | null;
  status: TypeCashRegisterSessionStatus;
  openingAmount: number;
  openedAt: Date;
  openedBy: string;
  closedAt: Date | null;
  closedBy: string | null;
  totalCash: number | null;
  totalPix: number | null;
  totalCard: number | null;
  createdBy: string;
  updatedBy: string;
  deletedBy?: string | null;
};

type OpenCashRegisterSessionProps = {
  company: Company;
  openingAmount: number;
  openedBy: string;
};

type CloseCashRegisterSessionProps = {
  totalCash: number;
  totalPix: number;
  totalCard: number;
  closedBy: string;
};

export interface CashRegisterSession extends CashRegisterSessionProps {}

@Data()
export class CashRegisterSession extends BaseEntity<CashRegisterSessionProps> {
  protected validate(): void {
    const validator = CashRegisterSessionValidatorFactory.create();

    const isValid = validator.validate(this.props);
    if (!isValid) {
      throw new EntityValidationError(validator.errors);
    }
  }

  static open(props: OpenCashRegisterSessionProps): CashRegisterSession {
    return new CashRegisterSession({
      id: crypto.randomUUID(),
      company: props.company,
      status: TypeCashRegisterSessionStatus.OPEN,
      openingAmount: props.openingAmount,
      openedAt: new Date(),
      openedBy: props.openedBy,
      closedAt: null,
      closedBy: null,
      totalCash: null,
      totalPix: null,
      totalCard: null,
      createdBy: props.openedBy,
      updatedBy: props.openedBy,
      deletedBy: null,
    });
  }

  close(props: CloseCashRegisterSessionProps): void {
    this.status = TypeCashRegisterSessionStatus.CLOSED;
    this.closedAt = new Date();
    this.closedBy = props.closedBy;
    this.totalCash = props.totalCash;
    this.totalPix = props.totalPix;
    this.totalCard = props.totalCard;
    this.updatedBy = props.closedBy;
    this.updateTimestamp();
  }
}
