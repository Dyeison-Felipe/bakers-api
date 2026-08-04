import { DailyProduction } from '@/core/daily-production/domain/entities/daily-production.entity';
import { CompanyRepositoryMapper } from '@/core/company/infra/database/typeorm/repository/company-repository.mapper';
import { CompanySchema } from '@/core/company/infra/database/typeorm/schema/company.schema';
import { DailyProductionSchema } from '../../schema/daily-production.schema';

export class DailyProductionMapper {
  static toEntity(schema: DailyProductionSchema): DailyProduction {
    return new DailyProduction({
      id: schema.id,
      company: schema.company
        ? CompanyRepositoryMapper.toEntity(schema.company)
        : null,
      productionDate: schema.productionDate,
      status: schema.status,
      createdBy: schema.createdBy,
      updatedBy: schema.updatedBy,
      deletedBy: schema.deletedBy,
      auditable: {
        createdAt: schema.createdAt,
        updatedAt: schema.updatedAt,
        deletedAt: schema.deletedAt,
      },
    });
  }

  static toSchema(entity: DailyProduction): DailyProductionSchema {
    return DailyProductionSchema.with({
      id: entity.id,
      company: { id: entity.company!.id } as CompanySchema,
      productionDate: entity.productionDate,
      status: entity.status,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
      deletedBy: entity.deletedBy,
      createdAt: entity.auditable?.createdAt,
      updatedAt: entity.auditable?.updatedAt,
      deletedAt: entity.auditable?.deletedAt,
    });
  }
}
