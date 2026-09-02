import { CompanyRepositoryMapper } from '@/core/company/infra/database/typeorm/repository/company-repository.mapper';
import { PlanMapper } from '@/core/plan/infra/database/typeorm/repositories/mapper/plan-mapper';
import { CompanySubscription } from '@/core/subscription/domain/entities/company-subscription.entity';
import { CompanySubscriptionSchema } from '../../schema/company-subscription.schema';

export class CompanySubscriptionMapper {
  static toEntity(schema: CompanySubscriptionSchema): CompanySubscription {
    return new CompanySubscription({
      id: schema.id,
      company: CompanyRepositoryMapper.toEntity(schema.company),
      plan: PlanMapper.toEntity(schema.plan),
      mercadoPagoSubscriptionId: schema.mercadoPagoSubscriptionId,
      status: schema.status as CompanySubscription['status'],
      payerEmail: schema.payerEmail,
      cardLastFourDigits: schema.cardLastFourDigits,
      cardBrand: schema.cardBrand,
      auditable: {
        createdAt: schema.createdAt,
        updatedAt: schema.updatedAt,
        deletedAt: schema.deletedAt,
      },
    });
  }

  static toSchema(entity: CompanySubscription): CompanySubscriptionSchema {
    return CompanySubscriptionSchema.with({
      id: entity.id,
      company: CompanyRepositoryMapper.toSchema(entity.company),
      plan: PlanMapper.toSchema(entity.plan),
      mercadoPagoSubscriptionId: entity.mercadoPagoSubscriptionId,
      status: entity.status,
      payerEmail: entity.payerEmail,
      cardLastFourDigits: entity.cardLastFourDigits ?? null,
      cardBrand: entity.cardBrand ?? null,
      createdAt: entity.auditable?.createdAt,
      updatedAt: entity.auditable?.updatedAt,
      deletedAt: entity.auditable?.deletedAt,
    });
  }
}
