// core/product/domain/repositories/product-additional-cost.repository.ts
import { BaseRepository } from '@/shared/domain/repository/base-repository';
import { ProductAdditionalCost } from '../entities/product-additional-cost.entity';

export interface ProductAdditionalCostRepository extends BaseRepository<ProductAdditionalCost>{
  findAllByProductId(productId: string): Promise<ProductAdditionalCost[]>;
}