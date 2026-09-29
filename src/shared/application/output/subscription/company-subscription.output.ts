import { CompanySubscriptionStatus } from '@/core/subscription/domain/entities/company-subscription.entity';

export type CompanySubscriptionOutput = {
  // Plano em vigor na empresa hoje (pode ser o gratuito).
  plan: {
    id: string;
    name: string;
    price: number;
  };
  planExpiresAt: Date;
  planExpired: boolean;
  // Assinatura paga mais recente (null = a empresa nunca assinou um plano pago).
  subscription: {
    status: CompanySubscriptionStatus;
    planName: string;
    cardBrand: string | null;
    cardLastFourDigits: string | null;
    // Próxima cobrança (ativa) ou fim do acesso (cancelada).
    currentPeriodEnd: Date | null;
  } | null;
};
