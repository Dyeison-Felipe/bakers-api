import { Plan } from '@/core/plan/domain/entities/plan.entity';
import { Injectable } from '@nestjs/common';
import { PlanSchema } from '../../schema/plan.schema';
import { PermissionMappper } from '@/core/permission/infra/database/typeorm/repositories/mapper/permission.mapper';

@Injectable()
export class PlanMapper {
  static toEntity(schema: PlanSchema): Plan {
    return new Plan({
      id: schema.id,
      name: schema.name,
      price: schema.price,
      description: schema.description,
      features: schema.features ?? [],
      active: schema.active,
      duration: schema.duration,
      userLimit: schema.userLimit,
      stripeProductId: schema.stripeProductId,
      stripePriceId: schema.stripePriceId,
      permissions: (schema.planPermission ?? []).map((pp) =>
        PermissionMappper.toEntity(pp.permission),
      ),
      auditable: {
        createdAt: schema.createdAt,
        updatedAt: schema.updatedAt,
        deletedAt: schema.deletedAt,
      },
    });
  }

  static toSchema(entity: Plan): PlanSchema {
    return PlanSchema.with({
      id: entity.id,
      name: entity.name,
      price: entity.price,
      description: entity.description,
      features: entity.features,
      active: entity.active,
      duration: entity.duration,
      userLimit: entity.userLimit,
      stripeProductId: entity.stripeProductId,
      stripePriceId: entity.stripePriceId,
      createdAt: entity.auditable?.createdAt,
      updatedAt: entity.auditable?.updatedAt,
      deletedAt: entity.auditable?.deletedAt,
    });
  }
}
