import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductRecipeLinkRepository } from '@/core/product/domain/repositories/product-recipe-link.repository';
import { ProductRecipeLinkSchema } from '../schema/product-recipe-link.schema';
import { ProductRecipeLinkMapper } from './mappers/product-recipe-link-mapper';
import { ProductRecipeLink } from '@/core/product/domain/entities/product-recipe-link.entity';

export class ProductRecipeLinkRepositoryImpl
  implements ProductRecipeLinkRepository
{
  constructor(
    @InjectRepository(ProductRecipeLinkSchema)
    private readonly repository: Repository<ProductRecipeLinkSchema>,
  ) {}

  async save(entity: ProductRecipeLink): Promise<ProductRecipeLink> {
    const schema = ProductRecipeLinkMapper.toSchema(entity);
    const saved = await this.repository.save(schema);

    return new ProductRecipeLink({
      id: saved.id,
      product: entity.product,
      recipe: entity.recipe,
      auditable: {
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
        deletedAt: saved.deletedAt,
      },
    });
  }

  async findAllByProductId(
    productId: string,
  ): Promise<ProductRecipeLink[]> {
    const schemas = await this.repository.find({
      where: { product: { id: productId } },
      relations: ['product', 'recipe'],
    });
    return schemas.map(ProductRecipeLinkMapper.toEntity);
  }

  async findAllByRecipeId(recipeId: string): Promise<ProductRecipeLink[]> {
    const schemas = await this.repository.find({
      where: { recipe: { id: recipeId } },
      relations: ['product', 'recipe'],
    });
    return schemas.map(ProductRecipeLinkMapper.toEntity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
