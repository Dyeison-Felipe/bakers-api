import { BaseRepository } from '@/shared/domain/repository/base-repository';
import { Category } from '../entities/category.entity';
import { Pagination, PaginationInput } from '@/shared/domain/pagination/pagination';

export interface CategoryRepository extends BaseRepository<Category> {
  findCategoryByNameAndCompanyId(
    categoryName: string,
    companyId: string,
  ): Promise<Category | null>;
  findAllByCompanyId(companyId: string, paginattion?: PaginationInput): Promise<Pagination<Category>>;
  findCategoryByIdAndCompanyId(
    categoryId: string,
    companyId: string,
  ): Promise<Category | null>;
}
