import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductAdditionalCostRepository } from '@/core/product/domain/repositories/product-additional-cost.repository';
import { ProductAdditionalCostSchema } from '../schema/product-additional-cost.schema';
import { ProductAdditionalCostMapper } from './mappers/product-additional-cost-mapepr';
import { ProductAdditionalCost } from '@/core/product/domain/entities/product-additional-cost.entity';

export class ProductAdditionalCostRepositoryImpl implements ProductAdditionalCostRepository {
  constructor(
    @InjectRepository(ProductAdditionalCostSchema)
    private readonly repository: Repository<ProductAdditionalCostSchema>,
  ) {}
  

  async save(entity: ProductAdditionalCost): Promise<ProductAdditionalCost> {
    const schema = ProductAdditionalCostMapper.toSchema(entity);
    const saved = await this.repository.save(schema);

    return new ProductAdditionalCost({
      id: saved.id,
      product: entity.product,
      additionalCost: entity.additionalCost,
      value: entity.value,
      auditable: {
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
        deletedAt: saved.deletedAt,
      },
    });
  }

  async update(entity: ProductAdditionalCost): Promise<void> {
    const schema = ProductAdditionalCostMapper.toSchema(entity);
    await this.repository.save(schema);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findById(id: string): Promise<ProductAdditionalCost | null> {
    const schema = await this.repository.findOne({
      where: { id },
      relations: ['product', 'additionalCost'],
    });
    return schema ? ProductAdditionalCostMapper.toEntity(schema) : null;
  }

  async findAllByProductId(
    productId: string,
  ): Promise<ProductAdditionalCost[]> {
    const schemas = await this.repository.find({
      where: { product: {id: productId} },
      relations: ['product', 'additionalCost'],
    });
    return schemas.map(ProductAdditionalCostMapper.toEntity);
  }
}
