import { ProductRecipeItemRepository } from '@/core/product/domain/repositories/product-recipe-item.repository';
import { ProductRecipeItemSchema } from '../schema/product-recipe-item';
import { Repository } from 'typeorm';
import { Inject } from '@nestjs/common';
import { ProductRecipeItem } from '@/core/product/domain/entities/product-recipe-item.entity';
import { ProductRecipeItemMapper } from './mappers/product-recipe-mapper';

export class ProductRecipeItemRepositoryImpl implements ProductRecipeItemRepository {
  constructor(
    @Inject(ProductRecipeItemSchema)
    private readonly productRecipeItemReposiory: Repository<ProductRecipeItemSchema>,
  ) {}

  async save(entity: ProductRecipeItem): Promise<ProductRecipeItem> {
    const schema = ProductRecipeItemMapper.toSchema(entity);

    const save = await this.productRecipeItemReposiory.save(schema);
    const productRecipeItemEntity = ProductRecipeItemMapper.toEntity(save);

    return productRecipeItemEntity;
  }

  async findAllByProductId(productId: string): Promise<ProductRecipeItem[]> {
    const productRecipeItems = await this.productRecipeItemReposiory.find({
      where: { product: { id: productId } },
      relations: ['material',],
    });

    const entities = productRecipeItems.map((productRecipeItem) =>
      ProductRecipeItemMapper.toEntity(productRecipeItem),
    );

    return entities;
  }
}
