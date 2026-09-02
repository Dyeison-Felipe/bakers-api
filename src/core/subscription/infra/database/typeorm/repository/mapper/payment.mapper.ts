import { Payment } from '@/core/subscription/domain/entities/payment.entity';
import { PaymentSchema } from '../../schema/payment.schema';
import { CompanySubscriptionSchema } from '../../schema/company-subscription.schema';

export class PaymentMapper {
  static toEntity(schema: PaymentSchema): Payment {
    return new Payment({
      id: schema.id,
      companySubscriptionId: schema.companySubscription.id,
      mercadoPagoPaymentId: schema.mercadoPagoPaymentId,
      type: schema.type as Payment['type'],
      status: schema.status,
      statusDetail: schema.statusDetail,
      amount: schema.amount,
      paidAt: schema.paidAt,
      auditable: {
        createdAt: schema.createdAt,
        updatedAt: schema.updatedAt,
        deletedAt: schema.deletedAt,
      },
    });
  }

  static toSchema(entity: Payment): PaymentSchema {
    return PaymentSchema.with({
      id: entity.id,
      // TypeORM só precisa do id pra persistir a coluna de FK — não é
      // necessário (nem desejável) carregar a assinatura inteira aqui.
      companySubscription: {
        id: entity.companySubscriptionId,
      } as CompanySubscriptionSchema,
      mercadoPagoPaymentId: entity.mercadoPagoPaymentId ?? null,
      type: entity.type,
      status: entity.status,
      statusDetail: entity.statusDetail ?? null,
      amount: entity.amount,
      paidAt: entity.paidAt ?? null,
      createdAt: entity.auditable?.createdAt,
      updatedAt: entity.auditable?.updatedAt,
      deletedAt: entity.auditable?.deletedAt,
    });
  }
}
