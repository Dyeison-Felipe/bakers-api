import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { CompanySubscriptionRepository } from '@/core/subscription/domain/repositories/company-subscription.repository';
import { StripeService } from '@/shared/application/stripe/stripe.service';
import { getErrorStack } from '@/shared/application/helpers/error.helper';
import { ConfirmSubscriptionPaymentUseCase } from '../../application/usecase/confirm-subscription-payment.usecase';

// Rede de segurança pro caso do webhook do Stripe nunca chegar
// (instabilidade de rede, deploy no meio da notificação, etc). Reprocessa
// pelo mesmo ConfirmSubscriptionPaymentUseCase do webhook — idempotente.
@Injectable()
export class SubscriptionReconciliationJob {
  private readonly logger = new Logger(SubscriptionReconciliationJob.name);

  // Folga sobre o prazo padrão do Stripe pra expirar uma subscription
  // 'incomplete' (23h) sem cobrança confirmada, pra não reconciliar cedo demais.
  private readonly PENDING_THRESHOLD_MS = 2 * 60 * 60 * 1000;

  constructor(
    @Inject(PROVIDERS.COMPANY_SUBSCRIPTION_REPOSITORY)
    private readonly companySubscriptionRepository: CompanySubscriptionRepository,
    @Inject(PROVIDERS.STRIPE_SERVICE)
    private readonly stripeService: StripeService,
    private readonly confirmSubscriptionPaymentUseCase: ConfirmSubscriptionPaymentUseCase,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleReconciliation(): Promise<void> {
    this.logger.log('Iniciando reconciliação de assinaturas pendentes');

    const threshold = new Date(Date.now() - this.PENDING_THRESHOLD_MS);
    const pending =
      await this.companySubscriptionRepository.findAllPendingOlderThan(threshold);

    for (const companySubscription of pending) {
      try {
        const subscription = await this.stripeService.getSubscription(
          companySubscription.stripeSubscriptionId,
        );

        if (subscription.status === 'active' || subscription.status === 'trialing') {
          await this.confirmSubscriptionPaymentUseCase.execute({
            stripeSubscriptionId: companySubscription.stripeSubscriptionId,
            approved: true,
            paymentStatus: subscription.status,
            amount: companySubscription.plan.price,
          });
        } else if (
          subscription.status === 'canceled' ||
          subscription.status === 'incomplete_expired'
        ) {
          await this.confirmSubscriptionPaymentUseCase.execute({
            stripeSubscriptionId: companySubscription.stripeSubscriptionId,
            approved: false,
            paymentStatus: subscription.status,
            amount: companySubscription.plan.price,
          });
        }
        // Ainda "incomplete" no Stripe: mantém aguardando, o job roda de
        // novo na próxima hora.
      } catch (error) {
        this.logger.error(
          `Falha ao reconciliar assinatura ${companySubscription.id}`,
          getErrorStack(error),
        );
      }
    }

    this.logger.log(
      `Reconciliação concluída: ${pending.length} assinatura(s) processada(s)`,
    );
  }
}
