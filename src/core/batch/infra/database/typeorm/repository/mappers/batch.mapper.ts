import { Batch } from '@/core/batch/domain/entities/batch.entity';
import { CompanyRepositoryMapper } from '@/core/company/infra/database/typeorm/repository/company-repository.mapper';
import { ProductMapper } from '@/core/product/infra/database/typeorm/repository/mappers/product.mapper';
import { CompanySchema } from '@/core/company/infra/database/typeorm/schema/company.schema';
import { ProductSchema } from '@/core/product/infra/database/typeorm/schema/product.schema';
import { BatchSchema } from '../../schema/batch.schema';

export class BatchMapper {
  static toEntity(schema: BatchSchema): Batch {
    return new Batch({
      id: schema.id,
      product: schema.product ? ProductMapper.toEntity(schema.product) : null,
      company: schema.company
        ? CompanyRepositoryMapper.toEntity(schema.company)
        : null,
      dailyProductionItemId: schema.dailyProductionItemId,
      quantity: schema.quantity,
      remainingQuantity: schema.remainingQuantity,
      unitOfMeasurement: schema.unitOfMeasurement,
      productionDate: schema.productionDate,
      expirationDate: schema.expirationDate,
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

  static toSchema(entity: Batch): BatchSchema {
    return BatchSchema.with({
      id: entity.id,
      product: { id: entity.product!.id } as ProductSchema,
      company: { id: entity.company!.id } as CompanySchema,
      dailyProductionItemId: entity.dailyProductionItemId,
      quantity: entity.quantity,
      remainingQuantity: entity.remainingQuantity,
      unitOfMeasurement: entity.unitOfMeasurement,
      productionDate: entity.productionDate,
      expirationDate: entity.expirationDate,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
      deletedBy: entity.deletedBy,
      createdAt: entity.auditable?.createdAt,
      updatedAt: entity.auditable?.updatedAt,
      deletedAt: entity.auditable?.deletedAt,
    });
  }
}
