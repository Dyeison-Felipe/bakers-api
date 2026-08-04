import { DailyProductionItem } from '@/core/daily-production/domain/entities/daily-production-item.entity';
import { ProductMapper } from '@/core/product/infra/database/typeorm/repository/mappers/product.mapper';
import { ProductSchema } from '@/core/product/infra/database/typeorm/schema/product.schema';
import { DailyProductionItemSchema } from '../../schema/daily-production-item.schema';
import { DailyProductionSchema } from '../../schema/daily-production.schema';
import { DailyProductionMapper } from './daily-production.mapper';

export class DailyProductionItemMapper {
  static toEntity(schema: DailyProductionItemSchema): DailyProductionItem {
    return new DailyProductionItem({
      id: schema.id,
      dailyProduction: schema.dailyProduction
        ? DailyProductionMapper.toEntity(schema.dailyProduction)
        : null,
      product: schema.product ? ProductMapper.toEntity(schema.product) : null,
      unitOfMeasurement: schema.unitOfMeasurement,
      plannedQuantity: schema.plannedQuantity,
      recipeMultiplier: schema.recipeMultiplier,
      plannedWeight: schema.plannedWeight,
      unitCostPriceSnapshot: schema.unitCostPriceSnapshot,
      pricePerKilogramSnapshot: schema.pricePerKilogramSnapshot,
      plannedCost: schema.plannedCost,
      status: schema.status,
      actualQuantity: schema.actualQuantity,
      actualWeight: schema.actualWeight,
      producedAt: schema.producedAt,
      producedBy: schema.producedBy,
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

  static toSchema(entity: DailyProductionItem): DailyProductionItemSchema {
    return DailyProductionItemSchema.with({
      id: entity.id,
      dailyProduction: { id: entity.dailyProduction!.id } as DailyProductionSchema,
      product: { id: entity.product!.id } as ProductSchema,
      unitOfMeasurement: entity.unitOfMeasurement,
      plannedQuantity: entity.plannedQuantity,
      recipeMultiplier: entity.recipeMultiplier,
      plannedWeight: entity.plannedWeight,
      unitCostPriceSnapshot: entity.unitCostPriceSnapshot,
      pricePerKilogramSnapshot: entity.pricePerKilogramSnapshot,
      plannedCost: entity.plannedCost,
      status: entity.status,
      actualQuantity: entity.actualQuantity,
      actualWeight: entity.actualWeight,
      producedAt: entity.producedAt,
      producedBy: entity.producedBy,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
      deletedBy: entity.deletedBy,
      createdAt: entity.auditable?.createdAt,
      updatedAt: entity.auditable?.updatedAt,
      deletedAt: entity.auditable?.deletedAt,
    });
  }
}
