import { CategoryRepository } from '@/core/category/domain/repositories/category.repository';
import { Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CategorySchema } from '../schema/category.schema';
import { FindOptionsRelations, Repository } from 'typeorm';
import { Category } from '@/core/category/domain/entities/category.entity';
import { CategoryMapper } from './category-mapper';

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

  async findAllByCompanyId(companyId: string): Promise<Category[]> {
    const categoriesSchema = await this.categoryRepository.find({
      where: { company: { id: companyId } },
      relations: this.getRelations()
    });
    // TODO
    const categoriesEntity = categoriesSchema.map((categorySchema) =>
      CategoryMapper.toEntity(categorySchema),
    );

    return categoriesEntity;
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

    const saveCategorySchema = await this.categoryRepository.save(categorySchema);

    const categoryEntity = CategoryMapper.toEntity(saveCategorySchema);

    return categoryEntity;
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
