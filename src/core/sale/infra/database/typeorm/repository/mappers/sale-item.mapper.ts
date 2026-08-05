import { SaleItem } from '@/core/sale/domain/entities/sale-item.entity';
import { ProductMapper } from '@/core/product/infra/database/typeorm/repository/mappers/product.mapper';
import { ProductSchema } from '@/core/product/infra/database/typeorm/schema/product.schema';
import { SaleItemSchema } from '../../schema/sale-item.schema';
import { SaleSchema } from '../../schema/sale.schema';
import { SaleMapper } from './sale.mapper';

export class SaleItemMapper {
  static toEntity(schema: SaleItemSchema): SaleItem {
    return new SaleItem({
      id: schema.id,
      sale: schema.sale ? SaleMapper.toEntity(schema.sale) : null,
      product: schema.product ? ProductMapper.toEntity(schema.product) : null,
      productNameSnapshot: schema.productNameSnapshot,
      unitOfMeasurement: schema.unitOfMeasurement,
      quantity: schema.quantity,
      weightInKg: schema.weightInKg,
      unitPriceSnapshot: schema.unitPriceSnapshot,
      unitCostSnapshot: schema.unitCostSnapshot,
      subtotal: schema.subtotal,
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

  static toSchema(entity: SaleItem): SaleItemSchema {
    return SaleItemSchema.with({
      id: entity.id,
      sale: { id: entity.sale!.id } as SaleSchema,
      product: { id: entity.product!.id } as ProductSchema,
      productNameSnapshot: entity.productNameSnapshot,
      unitOfMeasurement: entity.unitOfMeasurement,
      quantity: entity.quantity,
      weightInKg: entity.weightInKg,
      unitPriceSnapshot: entity.unitPriceSnapshot,
      unitCostSnapshot: entity.unitCostSnapshot,
      subtotal: entity.subtotal,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
      deletedBy: entity.deletedBy,
      createdAt: entity.auditable?.createdAt,
      updatedAt: entity.auditable?.updatedAt,
      deletedAt: entity.auditable?.deletedAt,
    });
  }
}
