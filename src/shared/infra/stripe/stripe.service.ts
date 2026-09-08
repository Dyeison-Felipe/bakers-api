import { Inject, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { EnvConfigService } from '@/shared/infra/env-config/env-config.service';
import { PROVIDERS } from '@/shared/application/constants/providers';
import {
  CardDetails,
  CreatePriceInput,
  CreateSetupIntentInput,
  CreateSetupIntentOutput,
  CreateSubscriptionInput,
  CreateSubscriptionOutput,
  StripeService,
  StripeSubscriptionStatus,
} from '@/shared/application/stripe/stripe.service';

@Injectable()
export class StripeServiceImpl implements StripeService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeServiceImpl.name);

  constructor(
    @Inject(PROVIDERS.ENV_CONFIG_SERVICE)
    private readonly envConfig: EnvConfigService,
  ) {
    this.stripe = new Stripe(envConfig.getStripeSecretKey());
  }

  async createSetupIntent(
    input: CreateSetupIntentInput,
  ): Promise<CreateSetupIntentOutput> {
    const setupIntent = await this.stripe.setupIntents.create({
      usage: 'off_session',
      metadata: input.customerEmail ? { email: input.customerEmail } : undefined,
    });

    return {
      clientSecret: setupIntent.client_secret as string,
      setupIntentId: setupIntent.id,
    };
  }

  async createCustomer(email: string, name: string): Promise<string> {
    const customer = await this.stripe.customers.create({ email, name });

    return customer.id;
  }

  async attachPaymentMethod(
    customerId: string,
    paymentMethodId: string,
  ): Promise<void> {
    await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    await this.stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
  }

  async retrievePaymentMethodCardDetails(
    paymentMethodId: string,
  ): Promise<CardDetails> {
    const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);

    return {
      brand: paymentMethod.card?.brand ?? null,
      last4: paymentMethod.card?.last4 ?? null,
    };
  }

  async createSubscription(
    input: CreateSubscriptionInput,
  ): Promise<CreateSubscriptionOutput> {
    const subscription = await this.stripe.subscriptions.create({
      customer: input.customerId,
      items: [{ price: input.priceId }],
      default_payment_method: input.paymentMethodId,
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice'],
    });

    // 'default_incomplete' só cria a fatura e o PaymentIntent associado —
    // NÃO tenta cobrar sozinho. Confirmamos aqui mesmo, de forma síncrona
    // (o usuário está na tela nesse instante, dentro do próprio POST de
    // cadastro). Se for recusada, não relançamos o erro: o Stripe já
    // registra a tentativa e
    // dispara 'invoice.payment_failed' pro webhook, que é quem decide (por
    // design) se a assinatura é aprovada ou rejeitada — nunca o retorno
    // síncrono desta chamada.
    const invoice = subscription.latest_invoice as Stripe.Invoice | string | null;
    const invoiceId = typeof invoice === 'string' ? invoice : invoice?.id;

    if (invoiceId) {
      await this.confirmInvoicePayment(invoiceId, input.paymentMethodId);
    }

    return { subscriptionId: subscription.id };
  }

  private async confirmInvoicePayment(
    invoiceId: string,
    paymentMethodId: string,
  ): Promise<void> {
    try {
      const payments = await this.stripe.invoicePayments.list({
        invoice: invoiceId,
        limit: 1,
      });
      const paymentIntentRef = payments.data[0]?.payment?.payment_intent;
      const paymentIntentId =
        typeof paymentIntentRef === 'string' ? paymentIntentRef : paymentIntentRef?.id;

      if (!paymentIntentId) return;

      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (
        paymentIntent.status === 'requires_confirmation' ||
        paymentIntent.status === 'requires_payment_method'
      ) {
        // Sem off_session: essa confirmação acontece de forma síncrona
        // dentro do próprio POST de cadastro do usuário (ele está "na
        // tela" nesse instante) — além disso, o Stripe recusa
        // off_session=true quando setup_future_usage está setado no
        // PaymentIntent (necessário aqui pra guardar o cartão pras
        // renovações futuras da assinatura).
        await this.stripe.paymentIntents.confirm(paymentIntentId, {
          payment_method: paymentMethodId,
        });
      }
    } catch (error) {
      // Recusa de cartão (ou qualquer outra falha na confirmação) não deve
      // abortar o cadastro — o webhook 'invoice.payment_failed' é quem
      // trata isso de forma assíncrona.
      this.logger.warn(
        `Confirmação da fatura ${invoiceId} não teve sucesso (tratado via webhook): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async getSubscription(
    subscriptionId: string,
  ): Promise<{ status: StripeSubscriptionStatus }> {
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

    return { status: subscription.status };
  }

  async cancelSubscriptionAtPeriodEnd(subscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.envConfig.getStripeWebhookSecret(),
    );
  }

  async createProduct(name: string): Promise<string> {
    const product = await this.stripe.products.create({ name });

    return product.id;
  }

  async updateProduct(productId: string, name: string): Promise<void> {
    await this.stripe.products.update(productId, { name });
  }

  async createPrice(input: CreatePriceInput): Promise<string> {
    const price = await this.stripe.prices.create({
      product: input.productId,
      unit_amount: input.unitAmountCents,
      currency: 'brl',
      recurring: { interval: 'day', interval_count: input.intervalDays },
    });

    return price.id;
  }

  async archivePrice(priceId: string): Promise<void> {
    await this.stripe.prices.update(priceId, { active: false });
  }
}
