export type CreateSubscriptionInput = {
  cardTokenId: string;
  payerEmail: string;
  transactionAmount: number;
  frequency: number;
  frequencyType: 'days' | 'months';
  externalReference: string;
  reason: string;
  // Exigido pela API do Mercado Pago mesmo nesse fluxo (sem redirect de
  // checkout) — URL pra onde o comprador voltaria caso precisasse
  // reautorizar a assinatura manualmente pelo painel do Mercado Pago.
  backUrl: string;
};

export type CreateSubscriptionOutput = {
  id: string;
  status: string;
};

export type SubscriptionStatus = {
  id: string;
  status: string;
};

export type PaymentDetails = {
  id: string;
  status: string;
  statusDetail: string | null;
  transactionAmount: number;
  dateApproved: string | null;
  cardLastFourDigits: string | null;
  cardBrand: string | null;
  subscriptionId: string | null;
};

// Wrapper de aplicação sobre o SDK oficial do Mercado Pago — mesmo padrão de
// JwtService/MailService: interface aqui, implementação concreta em
// src/shared/infra/mercado-pago, injetada via PROVIDERS.MERCADO_PAGO_SERVICE.
export interface MercadoPagoService {
  createSubscription(
    input: CreateSubscriptionInput,
  ): Promise<CreateSubscriptionOutput>;
  cancelSubscription(mercadoPagoSubscriptionId: string): Promise<void>;
  getSubscription(mercadoPagoSubscriptionId: string): Promise<SubscriptionStatus>;
  getPayment(mercadoPagoPaymentId: string): Promise<PaymentDetails>;
}
