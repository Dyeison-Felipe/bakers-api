// core/product/infra/database/typeorm/repository/product-query-repository-impl.ts
import {
  CategoryIdsWithLinkedProducts,
  ProductQueryRepository,
} from '@/core/product/application/queries/product.query';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductSchema } from '../../schema/product.schema';

export class ProductQueryRepositoryImpl implements ProductQueryRepository {
  constructor(
    @InjectRepository(ProductSchema)
    private readonly productRepository: Repository<ProductSchema>,
  ) {}

  async findCategoryIdsWithLinkedProducts(
    categoryIds: string[],
    companyId: string,
  ): Promise<CategoryIdsWithLinkedProducts> {
    const result = await this.productRepository
      .createQueryBuilder('product')
      .select('DISTINCT product.category', 'categoryId')
      .where('product.category IN (:...categoryIds)', { categoryIds })
      .andWhere('product.company = :companyId', { companyId })
      .getRawMany<{ categoryId: string }>();

    return result.map((row) => row.categoryId);
  }
}
