import Stripe from 'stripe';

export type CreateSetupIntentInput = {
  customerEmail?: string;
};

export type CreateSetupIntentOutput = {
  clientSecret: string;
  setupIntentId: string;
};

export type CardDetails = {
  brand: string | null;
  last4: string | null;
};

export type CreateSubscriptionInput = {
  customerId: string;
  priceId: string;
  paymentMethodId: string;
};

export type CreateSubscriptionOutput = {
  subscriptionId: string;
  // Fatura da 1ª cobrança — confirmada à parte (confirmInvoicePayment), pra
  // quem chama poder persistir a assinatura antes do webhook chegar.
  latestInvoiceId: string | null;
};

export type SubscriptionSnapshot = {
  status: StripeSubscriptionStatus;
  // Fim do período já pago (null só se o Stripe não devolver itens).
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};

export type CreatePriceInput = {
  productId: string;
  unitAmountCents: number;
  intervalDays: number;
};

export type StripeSubscriptionStatus = Stripe.Subscription.Status;

export interface StripeService {
  createSetupIntent(input: CreateSetupIntentInput): Promise<CreateSetupIntentOutput>;
  createCustomer(email: string, name: string): Promise<string>;
  attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<void>;
  retrievePaymentMethodCardDetails(paymentMethodId: string): Promise<CardDetails>;
  createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionOutput>;
  confirmInvoicePayment(invoiceId: string, paymentMethodId: string): Promise<void>;
  getSubscription(subscriptionId: string): Promise<SubscriptionSnapshot>;
  cancelSubscriptionAtPeriodEnd(subscriptionId: string): Promise<SubscriptionSnapshot>;
  // Desfaz o cancel_at_period_end (só funciona enquanto o período pago não acabou).
  resumeSubscription(subscriptionId: string): Promise<SubscriptionSnapshot>;
  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event;
  createProduct(name: string): Promise<string>;
  updateProduct(productId: string, name: string): Promise<void>;
  createPrice(input: CreatePriceInput): Promise<string>;
  archivePrice(priceId: string): Promise<void>;
}
