// core/product/infra/typeorm/mappers/product-additional-cost.mapper.ts
import { ProductAdditionalCost } from '@/core/product/domain/entities/product-additional-cost.entity';
import { ProductAdditionalCostSchema } from '../../schema/product-additional-cost.schema';
import { ProductMapper } from './product.mapper';
import { AdditionalCostMapper } from '@/core/additional-cost/infra/database/typeorm/repositories/mappers/additional-cost-mapper';

export class ProductAdditionalCostMapper {
  static toEntity(schema: ProductAdditionalCostSchema): ProductAdditionalCost {
    return new ProductAdditionalCost({
      id: schema.id,
      product: ProductMapper.toEntity(schema.product),
      additionalCost: AdditionalCostMapper.toEntity(schema.additionalCost),
      value: Number(schema.value),
    });
  }

  static toSchema(entity: ProductAdditionalCost): ProductAdditionalCostSchema {
    const schema = new ProductAdditionalCostSchema();
    schema.id = entity.id;
    schema.product = ProductMapper.toSchema(entity.product!);
    schema.additionalCost = AdditionalCostMapper.toSchema(entity.additionalCost!);
    schema.value = entity.value;
    return schema;
  }
}