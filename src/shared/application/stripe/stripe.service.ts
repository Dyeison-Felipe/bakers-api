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
  getSubscription(subscriptionId: string): Promise<{ status: StripeSubscriptionStatus }>;
  cancelSubscriptionAtPeriodEnd(subscriptionId: string): Promise<void>;
  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event;
  createProduct(name: string): Promise<string>;
  updateProduct(productId: string, name: string): Promise<void>;
  createPrice(input: CreatePriceInput): Promise<string>;
  archivePrice(priceId: string): Promise<void>;
}
