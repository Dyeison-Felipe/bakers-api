import { RecipeRepository } from '@/core/recipe/domain/repositories/recipe.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { RecipeSchema } from '../schema/recipe.schema';
import { In, Repository } from 'typeorm';
import { Recipe } from '@/core/recipe/domain/entities/recipe.entity';
import { RecipeMapper } from './mappers/recipe-mapper';

export class RecipeRepositoryImpl implements RecipeRepository {
  constructor(
    @InjectRepository(RecipeSchema)
    private readonly recipeRepository: Repository<RecipeSchema>,
  ) {}

  async findById(id: string): Promise<Recipe | null> {
    const schema = await this.recipeRepository.findOne({
      where: { id },
      relations: ['company'],
    });
    return schema ? RecipeMapper.toEntity(schema) : null;
  }

  async findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<Recipe | null> {
    const schema = await this.recipeRepository.findOne({
      where: { id, company: { id: companyId } },
      relations: ['company'],
    });
    return schema ? RecipeMapper.toEntity(schema) : null;
  }

  async findAllByCompanyId(companyId: string): Promise<Recipe[]> {
    const schemas = await this.recipeRepository.find({
      where: { company: { id: companyId } },
      relations: ['company'],
      order: { name: 'ASC' },
    });
    return schemas.map(RecipeMapper.toEntity);
  }

  async findAllByIdsAndCompanyId(
    ids: string[],
    companyId: string,
  ): Promise<Recipe[]> {
    const schemas = await this.recipeRepository.find({
      where: { id: In(ids), company: { id: companyId } },
      relations: ['company'],
    });
    return schemas.map(RecipeMapper.toEntity);
  }

  async save(entity: Recipe): Promise<Recipe> {
    const schema = RecipeMapper.toSchema(entity);
    const saved = await this.recipeRepository.save(schema);

    return new Recipe({
      id: saved.id,
      name: entity.name,
      company: entity.company,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
      deletedBy: entity.deletedBy,
      auditable: {
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
        deletedAt: saved.deletedAt,
      },
    });
  }

  async update(entity: Recipe): Promise<void> {
    const schema = RecipeMapper.toSchema(entity);
    await this.recipeRepository.save(schema);
  }

  async delete(id: string): Promise<void> {
    await this.recipeRepository.softDelete(id);
  }
}
