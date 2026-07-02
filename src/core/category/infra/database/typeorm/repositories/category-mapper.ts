import { Injectable } from '@nestjs/common';
import { CategorySchema } from '../schema/category.schema';
import { Category } from '@/core/category/domain/entities/category.entity';
import { CompanyRepositoryMapper } from '@/core/company/infra/database/typeorm/repository/company-repository.mapper';

@Injectable()
export class CategoryMapper {
  static toEntity(schema: CategorySchema): Category {
    return new Category({
      id: schema.id,
      name: schema.name,
      company: CompanyRepositoryMapper.toEntity(schema.company),
      parent: schema.parent
      ? { id: schema.parent.id, name: schema.parent.name } // referência leve
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

  static toSchema(entity: Category): CategorySchema {
    return CategorySchema.with({
      id: entity.id,
      name: entity.name,
      company: CompanyRepositoryMapper.toSchema(entity.company!),
     parent: entity.parent
      ? ({ id: entity.parent.id } as CategorySchema) // só a referência, TypeORM resolve o FK
      : null,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
      deletedBy: entity.deletedBy,
      createdAt: entity.auditable?.createdAt,
      updatedAt: entity.auditable?.updatedAt,
      deletedAt: entity.auditable?.deletedAt,
    });
  }
}
