import { CategoryRepository } from '@/core/category/domain/repositories/category.repository';
import { Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CategorySchema } from '../schema/category.schema';
import { FindOptionsRelations, Repository } from 'typeorm';
import { Category } from '@/core/category/domain/entities/category.entity';
import { CategoryMapper } from './category-mapper';
import {
  Pagination,
  PaginationInput,
} from '@/shared/domain/pagination/pagination';

export class CategoryRepositoryImpl implements CategoryRepository {
  constructor(
    @InjectRepository(CategorySchema)
    private readonly categoryRepository: Repository<CategorySchema>,
  ) {}

  async findCategoryByIdAndCompanyId(
    categoryId: string,
    companyId: string,
  ): Promise<Category | null> {
    const categorySchema = await this.categoryRepository.findOne({
      where: { id: categoryId, company: { id: companyId } },
      relations: this.getRelations(),
    });

    if (!categorySchema) return null;

    const categoryEntity = CategoryMapper.toEntity(categorySchema);

    return categoryEntity;
  }

  async findAllByCompanyId(
    companyId: string,
    pagination?: PaginationInput,
  ): Promise<Pagination<Category>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 10;
    const direction = pagination?.direction ?? 'DESC';

    const [categoriesSchema, totalItems] = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.parent', 'parent')
      .where('category.company = :companyId', { companyId })
      .orderBy('category.createdAt', direction)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const categoriesEntity = categoriesSchema.map((categorySchema) =>
      CategoryMapper.toEntity(categorySchema),
    );

    return {
      items: categoriesEntity,
      meta: {
        totalItems,
        itemCount: categoriesEntity.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async findCategoryByNameAndCompanyId(
    categoryName: string,
    companyId: string,
  ): Promise<Category | null> {
    const categorySchema = await this.categoryRepository.findOne({
      where: { name: categoryName, company: { id: companyId } },
      relations: this.getRelations(),
    });

    if (!categorySchema) return null;

    const categoryEntity = CategoryMapper.toEntity(categorySchema);

    return categoryEntity;
  }

  async save(entity: Category): Promise<Category> {
    const categorySchema = CategoryMapper.toSchema(entity);

    const schema = await this.categoryRepository.save(categorySchema);

    const categoryEntity = CategoryMapper.toEntity(schema);

    return categoryEntity;
  }

  async findById(id: string): Promise<Category | null> {
    const categorySchema = await this.categoryRepository.findOne({
      where: { id },
      relations: this.getRelations(),
    });

    console.log(JSON.stringify(categorySchema, null, 2));

    if (!categorySchema) return null;

    const categoryEntity = CategoryMapper.toEntity(categorySchema);

    return categoryEntity;
  }

  async update(entity: Category): Promise<Category> {
    const categorySchema = CategoryMapper.toSchema(entity);

    const saveCategorySchema =
      await this.categoryRepository.save(categorySchema);

    const categoryEntity = CategoryMapper.toEntity(saveCategorySchema);

    return categoryEntity;
  }

  async findChildrenByParentId(
    parentId: string,
    companyId: string,
  ): Promise<Category[]> {
    const childrenSchema = await this.categoryRepository.find({
      where: { parent: { id: parentId }, company: { id: companyId } },
      relations: this.getRelations(),
    });

    return childrenSchema.map((schema) => CategoryMapper.toEntity(schema));
  }

  async deleteMany(ids: string[]): Promise<void> {
    await this.categoryRepository.softDelete(ids);
  }

  async delete(id: string): Promise<void> {
    await this.categoryRepository.softDelete(id);
  }

  private getRelations(): FindOptionsRelations<CategorySchema> {
    return {
      parent: true,
      company: {
        address: {
          city: {
            state: true,
          },
        },
        plan: {
          planPermission: {
            permission: true,
          },
        },
      },
    };
  }
}
