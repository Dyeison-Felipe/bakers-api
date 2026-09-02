import { Inject, Logger } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { CompanySubscriptionRepository } from '@/core/subscription/domain/repositories/company-subscription.repository';
import { PaymentRepository } from '@/core/subscription/domain/repositories/payment.repository';
import { CompanySubscription } from '@/core/subscription/domain/entities/company-subscription.entity';
import { CompanyRepository } from '@/core/company/domain/repositories/company.repository';
import { UserRepository } from '@/core/user/domain/repositories/user.repository';
import { MailService } from '@/shared/application/mail/mail.service';
import { Payment, PaymentType } from '@/core/subscription/domain/entities/payment.entity';
import { getErrorStack } from '@/shared/application/helpers/error.helper';

type Input = {
  mercadoPagoSubscriptionId: string;
  approved: boolean;
  mercadoPagoPaymentId?: string | null;
  paymentStatus: string;
  paymentStatusDetail?: string | null;
  amount: number;
};

type Output = void;

// Chamado tanto pelo webhook do Mercado Pago quanto pelo job de
// reconciliação — idempotente por status: uma assinatura que já saiu de
// 'pending'/'active' (virou 'rejected'/'cancelled') não é reprocessada.
export class ConfirmSubscriptionPaymentUseCase
  implements UseCase<Input, Output>
{
  private readonly logger = new Logger(ConfirmSubscriptionPaymentUseCase.name);

  constructor(
    @Inject(PROVIDERS.COMPANY_SUBSCRIPTION_REPOSITORY)
    private readonly companySubscriptionRepository: CompanySubscriptionRepository,
    @Inject(PROVIDERS.PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepository,
    @Inject(PROVIDERS.COMPANY_REPOSITORY)
    private readonly companyRepository: CompanyRepository,
    @Inject(PROVIDERS.USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PROVIDERS.MAIL_SERVICE)
    private readonly mailService: MailService,
  ) {}

  async execute(input: Input): Promise<Output> {
    const companySubscription =
      await this.companySubscriptionRepository.findByMercadoPagoSubscriptionId(
        input.mercadoPagoSubscriptionId,
      );

    if (!companySubscription) {
      this.logger.warn(
        `Notificação do Mercado Pago recebida para uma assinatura desconhecida: ${input.mercadoPagoSubscriptionId}`,
      );
      return;
    }

    if (
      companySubscription.status !== 'pending' &&
      companySubscription.status !== 'active'
    ) {
      return;
    }

    const isInitialCharge = companySubscription.status === 'pending';

    await this.logPayment(companySubscription.id, input, isInitialCharge);

    if (input.approved) {
      await this.handleApproved(companySubscription, isInitialCharge);
      return;
    }

    if (isInitialCharge) {
      await this.handleInitialRejection(companySubscription);
    }
    // Renovação recusada: não faz nada aqui — o Mercado Pago tenta de novo
    // por conta própria, e o PlanExpirationJob já existente desativa a
    // empresa se planExpiresAt vencer sem uma renovação bem-sucedida.
  }

  private async logPayment(
    companySubscriptionId: string,
    input: Input,
    isInitialCharge: boolean,
  ): Promise<void> {
    const payment = Payment.create({
      companySubscriptionId,
      mercadoPagoPaymentId: input.mercadoPagoPaymentId ?? null,
      type: (isInitialCharge ? 'initial' : 'renewal') as PaymentType,
      status: input.paymentStatus,
      statusDetail: input.paymentStatusDetail ?? null,
      amount: input.amount,
      paidAt: input.approved ? new Date() : null,
    });

    try {
      await this.paymentRepository.save(payment);
    } catch (error) {
      this.logger.error(
        `Falha ao registrar log de pagamento da assinatura ${companySubscriptionId}`,
        getErrorStack(error),
      );
    }
  }

  private async handleApproved(
    companySubscription: CompanySubscription,
    isInitialCharge: boolean,
  ): Promise<void> {
    const company = companySubscription.company;
    const plan = companySubscription.plan;

    company.renewPlan(plan, company.updatedBy);
    await this.companyRepository.update(company);

    if (isInitialCharge) {
      companySubscription.activate();
      await this.companySubscriptionRepository.update(companySubscription);

      const admin = await this.userRepository.findByEmail(
        companySubscription.payerEmail,
      );

      if (admin) {
        admin.verifyEmail();
        await this.userRepository.update(admin);
      }

      await this.mailService
        .sendMail({
          to: company.email,
          template: 'subscription-confirmed',
          subject: 'Pagamento confirmado',
          context: {
            fantasyName: company.fantasyName,
            year: new Date().getFullYear(),
          },
        })
        .catch((error) =>
          this.logger.error(
            'Falha ao enviar e-mail de confirmação de pagamento',
            getErrorStack(error),
          ),
        );
    }
  }

  private async handleInitialRejection(
    companySubscription: CompanySubscription,
  ): Promise<void> {
    companySubscription.reject();
    await this.companySubscriptionRepository.update(companySubscription);

    const company = companySubscription.company;
    const admin = await this.userRepository.findByEmail(
      companySubscription.payerEmail,
    );

    // Cobrança inicial recusada: o cadastro criado de forma otimista nunca
    // chegou a valer — remove (soft-delete) empresa e usuário. O CNPJ/e-mail
    // ficam livres pra uma nova tentativa (find* já ignora soft-deleted).
    await this.companyRepository.delete(company.id);
    if (admin) {
      await this.userRepository.delete(admin.id);
    }
  }
}
