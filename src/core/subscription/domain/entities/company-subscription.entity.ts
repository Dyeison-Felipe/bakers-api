import { Data } from '@/shared/domain/decorators/data.decorator';
import { BaseEntity } from '@/shared/domain/entity/base-entity';
import { EntityValidationError } from '@/shared/application/errors/validation-error';
import { Company } from '@/core/company/domain/entities/company.entity';
import { Plan } from '@/core/plan/domain/entities/plan.entity';
import { CompanySubscriptionValidatorFactory } from '../validators/company-subscription-validator';

export type CompanySubscriptionStatus =
  | 'pending'
  | 'active'
  | 'cancelled'
  | 'rejected';

export type CompanySubscriptionProps = {
  company: Company;
  plan: Plan;
  mercadoPagoSubscriptionId: string;
  status: CompanySubscriptionStatus;
  payerEmail: string;
  cardLastFourDigits?: string | null;
  cardBrand?: string | null;
};

type CreateCompanySubscriptionProps = {
  company: Company;
  plan: Plan;
  mercadoPagoSubscriptionId: string;
  payerEmail: string;
  cardLastFourDigits?: string | null;
  cardBrand?: string | null;
};

export interface CompanySubscription extends CompanySubscriptionProps {}

@Data()
export class CompanySubscription extends BaseEntity<CompanySubscriptionProps> {
  static create(props: CreateCompanySubscriptionProps): CompanySubscription {
    return new CompanySubscription({
      id: crypto.randomUUID(),
      company: props.company,
      plan: props.plan,
      mercadoPagoSubscriptionId: props.mercadoPagoSubscriptionId,
      status: 'pending',
      payerEmail: props.payerEmail,
      cardLastFourDigits: props.cardLastFourDigits ?? null,
      cardBrand: props.cardBrand ?? null,
    });
  }

  // 1ª cobrança aprovada: libera a assinatura pra valer (quem libera a
  // empresa/usuário é o ConfirmSubscriptionPaymentUseCase, não esta entidade).
  activate(): void {
    this.status = 'active';
    this.updateTimestamp();
  }

  // 1ª cobrança recusada: a assinatura nunca chegou a valer.
  reject(): void {
    this.status = 'rejected';
    this.updateTimestamp();
  }

  // Cancelamento self-service — não mexe em company.active/planExpiresAt,
  // só impede a próxima renovação de ser tentada.
  cancel(): void {
    this.status = 'cancelled';
    this.updateTimestamp();
  }

  protected validate(): void {
    const validator = CompanySubscriptionValidatorFactory.create();
    const isValid = validator.validate(this.props);

    if (!isValid) {
      throw new EntityValidationError(validator.errors);
    }
  }
}
