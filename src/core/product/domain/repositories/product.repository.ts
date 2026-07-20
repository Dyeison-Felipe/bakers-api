import { BaseRepository } from '@/shared/domain/repository/base-repository';
import { Product } from '../entities/product.entity';
import {
  Pagination,
  PaginationInput,
} from '@/shared/domain/pagination/pagination';

export interface ProductRepository extends BaseRepository<Product> {
  findProductByNameAndCompanyId(
    name: string,
    companyId: string,
  ): Promise<Product | null>;
  findAllProductsByCompanyIdAndFilterCategoryId(
    companyId: string,
    categoryId?: string,
    pagination?: PaginationInput,
  ): Promise<Pagination<Product>>;
  existsByCategoryIds(categoryIds: string[], companyId: string): Promise<boolean>;
}
