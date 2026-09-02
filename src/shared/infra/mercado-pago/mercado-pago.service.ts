import { Injectable, Inject } from '@nestjs/common';
import { MercadoPagoConfig, Payment, PreApproval } from 'mercadopago';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { EnvConfig } from '@/shared/application/env-config/env-config';
import {
  CreateSubscriptionInput,
  CreateSubscriptionOutput,
  MercadoPagoService,
  PaymentDetails,
  SubscriptionStatus,
} from '@/shared/application/mercado-pago/mercado-pago.service';

@Injectable()
export class MercadoPagoServiceImpl implements MercadoPagoService {
  private readonly client: MercadoPagoConfig;

  constructor(
    @Inject(PROVIDERS.ENV_CONFIG_SERVICE)
    private readonly envConfigService: EnvConfig,
  ) {
    this.client = new MercadoPagoConfig({
      accessToken: this.envConfigService.getMercadoPagoAccessToken(),
    });
  }

  async createSubscription(
    input: CreateSubscriptionInput,
  ): Promise<CreateSubscriptionOutput> {
    const preApproval = new PreApproval(this.client);

    const response = await preApproval.create({
      body: {
        card_token_id: input.cardTokenId,
        payer_email: input.payerEmail,
        external_reference: input.externalReference,
        reason: input.reason,
        back_url: input.backUrl,
        status: 'authorized',
        auto_recurring: {
          frequency: input.frequency,
          frequency_type: input.frequencyType,
          transaction_amount: input.transactionAmount,
          currency_id: 'BRL',
        },
      },
    });

    return {
      id: response.id as string,
      status: response.status as string,
    };
  }

  async cancelSubscription(mercadoPagoSubscriptionId: string): Promise<void> {
    const preApproval = new PreApproval(this.client);

    await preApproval.update({
      id: mercadoPagoSubscriptionId,
      body: { status: 'cancelled' },
    });
  }

  async getSubscription(
    mercadoPagoSubscriptionId: string,
  ): Promise<SubscriptionStatus> {
    const preApproval = new PreApproval(this.client);

    const response = await preApproval.get({ id: mercadoPagoSubscriptionId });

    return {
      id: response.id as string,
      status: response.status as string,
    };
  }

  async getPayment(mercadoPagoPaymentId: string): Promise<PaymentDetails> {
    const payment = new Payment(this.client);

    const response = await payment.get({ id: mercadoPagoPaymentId });

    // NOTA: o SDK só expõe o id da assinatura vinculada a este pagamento em
    // point_of_interaction.transaction_data.subscription_id — validar contra
    // o sandbox que esse campo realmente vem preenchido pra cobranças de
    // preapproval via cartão (a documentação foca em QR/Pix nesse objeto).

    return {
      id: String(response.id),
      status: response.status as string,
      statusDetail: response.status_detail ?? null,
      transactionAmount: response.transaction_amount ?? 0,
      dateApproved: response.date_approved ?? null,
      cardLastFourDigits: response.card?.last_four_digits ?? null,
      cardBrand: response.payment_method_id ?? null,
      subscriptionId:
        response.point_of_interaction?.transaction_data?.subscription_id ??
        null,
    };
  }
}
