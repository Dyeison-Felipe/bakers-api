import { StockMovement } from '@/core/stock-movement/domain/entities/stock-movement.entity';
import { ProductSchema } from '@/core/product/infra/database/typeorm/schema/product.schema';
import { StockMovementSchema } from '../../schema/stock-movement.schema';

export class StockMovementMapper {
  static toEntity(schema: StockMovementSchema): StockMovement {
    return new StockMovement({
      id: schema.id,
      productId: schema.product.id,
      type: schema.type,
      quantity: schema.quantity,
      reason: schema.reason,
      reasonDescription: schema.reasonDescription,
      unitCostSnapshot: schema.unitCostSnapshot,
      createdBy: schema.createdBy,
      auditable: {
        createdAt: schema.createdAt,
        updatedAt: schema.updatedAt,
        deletedAt: schema.deletedAt,
      },
    });
  }

  static toSchema(entity: StockMovement): StockMovementSchema {
    return StockMovementSchema.with({
      id: entity.id,
      product: { id: entity.productId } as ProductSchema,
      type: entity.type,
      quantity: entity.quantity,
      reason: entity.reason,
      reasonDescription: entity.reasonDescription,
      unitCostSnapshot: entity.unitCostSnapshot,
      createdBy: entity.createdBy,
      createdAt: entity.auditable?.createdAt,
    });
  }
}
