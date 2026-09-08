import { Controller, Headers, HttpCode, HttpStatus, Inject, Logger, Post, RawBodyRequest, Req } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import Stripe from 'stripe';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { Public } from '@/shared/infra/decorators/permission.decorator';
import { StripeService } from '@/shared/application/stripe/stripe.service';
import { UnauthorizedError } from '@/shared/application/errors/unauthorized-error';
import { ConfirmSubscriptionPaymentUseCase } from '../../application/usecase/confirm-subscription-payment.usecase';

const HANDLED_EVENT_TYPES = ['invoice.paid', 'invoice.payment_failed'];

@ApiExcludeController()
@Controller('v1/webhooks/stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly confirmSubscriptionPaymentUseCase: ConfirmSubscriptionPaymentUseCase,
    @Inject(PROVIDERS.STRIPE_SERVICE)
    private readonly stripeService: StripeService,
  ) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.OK)
  async handle(
    @Req() request: RawBodyRequest<FastifyRequest>,
    @Headers('stripe-signature') signature: string | undefined,
  ): Promise<void> {
    if (!request.rawBody || !signature) {
      this.logger.warn(
        `Webhook rejeitado: rawBody presente=${!!request.rawBody}, signature presente=${!!signature}`,
      );
      throw new UnauthorizedError('Requisição de webhook inválida');
    }

    let event: Stripe.Event;

    try {
      event = this.stripeService.constructWebhookEvent(request.rawBody, signature);
    } catch (error) {
      this.logger.warn(
        `Assinatura do webhook inválida: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new UnauthorizedError('Assinatura do webhook inválida');
    }

    if (!HANDLED_EVENT_TYPES.includes(event.type)) {
      return;
    }

    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = this.extractSubscriptionId(invoice);

    if (!subscriptionId) {
      return;
    }

    const paymentIntentId = this.extractPaymentIntentId(invoice);

    await this.confirmSubscriptionPaymentUseCase.execute({
      stripeSubscriptionId: subscriptionId,
      approved: event.type === 'invoice.paid',
      stripePaymentIntentId: paymentIntentId,
      paymentStatus: invoice.status ?? event.type,
      paymentStatusDetail:
        event.type === 'invoice.payment_failed'
          ? (invoice.last_finalization_error?.message ?? null)
          : null,
      amount: invoice.amount_paid ? invoice.amount_paid / 100 : invoice.amount_due / 100,
    });
  }

  private extractSubscriptionId(invoice: Stripe.Invoice): string | null {
    const subscription = invoice.parent?.subscription_details?.subscription;

    if (!subscription) return null;

    return typeof subscription === 'string' ? subscription : subscription.id;
  }

  private extractPaymentIntentId(invoice: Stripe.Invoice): string | null {
    const payment = invoice.payments?.data.find(
      (item) => item.payment.type === 'payment_intent',
    );
    const paymentIntent = payment?.payment.payment_intent;

    if (!paymentIntent) return null;

    return typeof paymentIntent === 'string' ? paymentIntent : paymentIntent.id;
  }
}
