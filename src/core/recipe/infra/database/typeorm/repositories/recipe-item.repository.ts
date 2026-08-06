import { RecipeItemRepository } from '@/core/recipe/domain/repositories/recipe-item.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { RecipeItemSchema } from '../schema/recipe-item.schema';
import { In, Repository } from 'typeorm';
import { RecipeItem } from '@/core/recipe/domain/entities/recipe-item.entity';
import { RecipeItemMapper } from './mappers/recipe-item-mapper';

export class RecipeItemRepositoryImpl implements RecipeItemRepository {
  constructor(
    @InjectRepository(RecipeItemSchema)
    private readonly recipeItemRepository: Repository<RecipeItemSchema>,
  ) {}

  async save(entity: RecipeItem): Promise<RecipeItem> {
    const schema = RecipeItemMapper.toSchema(entity);
    const saved = await this.recipeItemRepository.save(schema);

    return new RecipeItem({
      id: saved.id,
      recipe: entity.recipe,
      material: entity.material,
      quantity: entity.quantity,
      auditable: {
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
        deletedAt: saved.deletedAt,
      },
    });
  }

  async findAllByRecipeId(recipeId: string): Promise<RecipeItem[]> {
    const items = await this.recipeItemRepository.find({
      where: { recipe: { id: recipeId } },
      relations: ['material', 'recipe'],
    });
    return items.map(RecipeItemMapper.toEntity);
  }

  async findAllByRecipeIds(recipeIds: string[]): Promise<RecipeItem[]> {
    if (!recipeIds.length) return [];

    const items = await this.recipeItemRepository.find({
      where: { recipe: { id: In(recipeIds) } },
      relations: ['material', 'recipe'],
    });
    return items.map(RecipeItemMapper.toEntity);
  }

  async deleteById(id: string): Promise<void> {
    await this.recipeItemRepository.delete(id);
  }

  async deleteAllByRecipeId(recipeId: string): Promise<void> {
    await this.recipeItemRepository.delete({ recipe: { id: recipeId } });
  }
}
