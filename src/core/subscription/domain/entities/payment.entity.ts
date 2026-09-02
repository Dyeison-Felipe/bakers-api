import { Data } from '@/shared/domain/decorators/data.decorator';
import { BaseEntity } from '@/shared/domain/entity/base-entity';
import { EntityValidationError } from '@/shared/application/errors/validation-error';
import { PaymentValidatorFactory } from '../validators/payment-validator';

export type PaymentType = 'initial' | 'renewal';

export type PaymentProps = {
  // Referenciado só pelo id (não pela entidade inteira) — quem grava o log
  // de um pagamento normalmente só tem o id da assinatura em mãos, sem
  // precisar carregar company/plan pra isso.
  companySubscriptionId: string;
  mercadoPagoPaymentId?: string | null;
  type: PaymentType;
  status: string;
  statusDetail?: string | null;
  amount: number;
  paidAt?: Date | null;
};

type CreatePaymentProps = {
  companySubscriptionId: string;
  mercadoPagoPaymentId?: string | null;
  type: PaymentType;
  status: string;
  statusDetail?: string | null;
  amount: number;
  paidAt?: Date | null;
};

export interface Payment extends PaymentProps {}

// Registro de log de cada evento de cobrança reportado pelo Mercado Pago
// (aprovação inicial, renovação, recusa) — nunca é atualizado depois de
// criado, só consultado pra histórico/auditoria.
@Data()
export class Payment extends BaseEntity<PaymentProps> {
  static create(props: CreatePaymentProps): Payment {
    return new Payment({
      id: crypto.randomUUID(),
      companySubscriptionId: props.companySubscriptionId,
      mercadoPagoPaymentId: props.mercadoPagoPaymentId ?? null,
      type: props.type,
      status: props.status,
      statusDetail: props.statusDetail ?? null,
      amount: props.amount,
      paidAt: props.paidAt ?? null,
    });
  }

  protected validate(): void {
    const validator = PaymentValidatorFactory.create();
    const isValid = validator.validate(this.props);

    if (!isValid) {
      throw new EntityValidationError(validator.errors);
    }
  }
}
