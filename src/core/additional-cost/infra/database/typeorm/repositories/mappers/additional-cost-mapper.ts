import { AdditionalCost } from '@/core/additional-cost/domain/entities/additional-cost.entity';
import { AdditionalCostSchema } from '../../schema/additional-cost.schema';
import { CompanyRepositoryMapper } from '@/core/company/infra/database/typeorm/repository/company-repository.mapper';

// core/additional-cost/infra/typeorm/mappers/additional-cost.mapper.ts
export class AdditionalCostMapper {
  static toEntity(schema: AdditionalCostSchema): AdditionalCost {
    return new AdditionalCost({
      id: schema.id,
      name: schema.name,
      company: schema.company
        ? CompanyRepositoryMapper.toEntity(schema.company)
        : null,
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

  static toSchema(entity: AdditionalCost): AdditionalCostSchema {
    const schema = new AdditionalCostSchema();
    schema.id = entity.id;
    schema.name = entity.name;
    schema.company = CompanyRepositoryMapper.toSchema(entity.company!);
    schema.createdBy = entity.createdBy;
    schema.updatedBy = entity.updatedBy;
    return schema;
  }

  static toReference(id: string): AdditionalCostSchema {
    return { id } as AdditionalCostSchema;
  }
}
