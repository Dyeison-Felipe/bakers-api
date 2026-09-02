import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { CompanySubscriptionRepository } from '@/core/subscription/domain/repositories/company-subscription.repository';
import { MercadoPagoService } from '@/shared/application/mercado-pago/mercado-pago.service';
import { getErrorStack } from '@/shared/application/helpers/error.helper';
import { ConfirmSubscriptionPaymentUseCase } from '../../application/usecase/confirm-subscription-payment.usecase';

// Rede de segurança pro caso do webhook do Mercado Pago nunca chegar
// (instabilidade de rede, deploy no meio da notificação, etc). Reprocessa
// pelo mesmo ConfirmSubscriptionPaymentUseCase do webhook — idempotente.
@Injectable()
export class SubscriptionReconciliationJob {
  private readonly logger = new Logger(SubscriptionReconciliationJob.name);

  // Folga sobre o atraso de ~1h documentado pelo Mercado Pago pra 1ª
  // cobrança de uma assinatura nova, pra não reconciliar cedo demais.
  private readonly PENDING_THRESHOLD_MS = 2 * 60 * 60 * 1000;

  constructor(
    @Inject(PROVIDERS.COMPANY_SUBSCRIPTION_REPOSITORY)
    private readonly companySubscriptionRepository: CompanySubscriptionRepository,
    @Inject(PROVIDERS.MERCADO_PAGO_SERVICE)
    private readonly mercadoPagoService: MercadoPagoService,
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
        const subscription = await this.mercadoPagoService.getSubscription(
          companySubscription.mercadoPagoSubscriptionId,
        );

        // NOTA: validar contra o sandbox do Mercado Pago se "authorized" já
        // significa "1ª cobrança confirmada" ou só "mandato autorizado,
        // cobrança ainda em processamento" — na dúvida, o webhook continua
        // sendo o caminho principal; isto aqui é só o fallback.
        if (subscription.status === 'authorized') {
          await this.confirmSubscriptionPaymentUseCase.execute({
            mercadoPagoSubscriptionId: companySubscription.mercadoPagoSubscriptionId,
            approved: true,
            paymentStatus: subscription.status,
            amount: companySubscription.plan.price,
          });
        } else if (
          subscription.status === 'cancelled' ||
          subscription.status === 'paused'
        ) {
          await this.confirmSubscriptionPaymentUseCase.execute({
            mercadoPagoSubscriptionId: companySubscription.mercadoPagoSubscriptionId,
            approved: false,
            paymentStatus: subscription.status,
            amount: companySubscription.plan.price,
          });
        }
        // Ainda "pending" no MP: mantém aguardando, o job roda de novo na
        // próxima hora.
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
