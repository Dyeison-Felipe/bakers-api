import { ProductRecipeItemRepository } from '@/core/product/domain/repositories/product-recipe-item.repository';
import { ProductRecipeItemSchema } from '../schema/product-recipe-item';
import { In, Repository } from 'typeorm';
import { Inject } from '@nestjs/common';
import { ProductRecipeItem } from '@/core/product/domain/entities/product-recipe-item.entity';
import { ProductRecipeItemMapper } from './mappers/product-recipe-mapper';
import { InjectRepository } from '@nestjs/typeorm';

export class ProductRecipeItemRepositoryImpl implements ProductRecipeItemRepository {
  constructor(
    @InjectRepository(ProductRecipeItemSchema)
    private readonly productRecipeItemReposiory: Repository<ProductRecipeItemSchema>,
  ) {}

  async save(entity: ProductRecipeItem): Promise<ProductRecipeItem> {
    const schema = ProductRecipeItemMapper.toSchema(entity);

    const save = await this.productRecipeItemReposiory.save(schema);
    const productRecipeItemEntity = ProductRecipeItemMapper.toEntity(save);

    return productRecipeItemEntity;
  }

  async findAllByProductIdAndCompanyId(
    productIds: string[],
    companyId: string,
  ): Promise<ProductRecipeItem[]> {
    const productRecipeItems = await this.productRecipeItemReposiory.find({
      where: { product: { id: In(productIds), company: { id: companyId } } },
      relations: ['material', 'product']
    });

    const entities = productRecipeItems.map((productRecipeItem) =>
      ProductRecipeItemMapper.toEntity(productRecipeItem),
    );

    return entities;
  }

  async findAllByProductId(productId: string): Promise<ProductRecipeItem[]> {
  const items = await this.productRecipeItemReposiory.find({
    where: { product: { id: productId } },
    relations: ['material', 'product'],
  });

  return items.map((item) => ProductRecipeItemMapper.toEntity(item));
}

async deleteById(id: string): Promise<void> {
  await this.productRecipeItemReposiory.delete(id);
}
}
