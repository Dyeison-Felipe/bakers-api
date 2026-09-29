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

// De onde a assinatura veio: o cadastro da empresa ou uma nova assinatura
// feita de dentro do sistema (plano vencido ou troca do plano gratuito por
// um pago). Muda o que acontece se a 1ª cobrança for recusada.
export type CompanySubscriptionOrigin = 'signup' | 'renewal';

export type CompanySubscriptionProps = {
  company: Company;
  plan: Plan;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: CompanySubscriptionStatus;
  origin: CompanySubscriptionOrigin;
  payerEmail: string;
  cardLastFourDigits?: string | null;
  cardBrand?: string | null;
};

type CreateCompanySubscriptionProps = {
  company: Company;
  plan: Plan;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  origin?: CompanySubscriptionOrigin;
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
      stripeSubscriptionId: props.stripeSubscriptionId,
      stripeCustomerId: props.stripeCustomerId,
      status: 'pending',
      origin: props.origin ?? 'signup',
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

  // Desfaz o cancelamento enquanto o período pago ainda não acabou — a
  // cobrança recorrente volta a acontecer normalmente.
  resume(): void {
    this.status = 'active';
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
