import { Recipe } from '@/core/recipe/domain/entities/recipe.entity';
import { RecipeSchema } from '../../schema/recipe.schema';
import { CompanyRepositoryMapper } from '@/core/company/infra/database/typeorm/repository/company-repository.mapper';

export class RecipeMapper {
  static toEntity(schema: RecipeSchema): Recipe {
    return new Recipe({
      id: schema.id,
      name: schema.name,
      company: schema.company
        ? CompanyRepositoryMapper.toEntity(schema.company)
        : null,
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

  static toSchema(entity: Recipe): RecipeSchema {
    const schema = new RecipeSchema();
    schema.id = entity.id;
    schema.name = entity.name;
    schema.company = CompanyRepositoryMapper.toReference(entity.company!.id);
    schema.createdBy = entity.createdBy;
    schema.updatedBy = entity.updatedBy;
    return schema;
  }

  static toReference(id: string): RecipeSchema {
    return { id } as RecipeSchema;
  }
}
