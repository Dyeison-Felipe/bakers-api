import { BaseRepository } from '@/shared/domain/repository/base-repository';
import { Product } from '../entities/product.entity';
import {
  Pagination,
  PaginationInput,
} from '@/shared/domain/pagination/pagination';
import { TypeProduct } from '@/shared/infra/enums/product';

export interface ProductRepository extends BaseRepository<Product> {

  update(entity: Product): Promise<void>

  findProductByNameAndCompanyId(
    name: string,
    companyId: string,
  ): Promise<Product | null>;
  findAllProductsByCompanyId(
    companyId: string,
    status?: boolean,
    categoryId?: string,
    typeProduct?: TypeProduct,
    pagination?: PaginationInput,
    name?: string,
  ): Promise<Pagination<Product>>;
  existsByCategoryIds(
    categoryIds: string[],
    companyId: string,
  ): Promise<boolean>;

  findProductByIdAndCompanyId(
    productId: string,
    companyId: string,
  ): Promise<Product | null>;

  findAllByIdsAndCompanyId(ids: string[], companyId: string): Promise<Product[]>;

  findEligibleForSale(
    companyId: string,
    search?: string,
    pagination?: PaginationInput,
  ): Promise<Pagination<Product>>;

  findLowStockByCompanyId(companyId: string): Promise<Product[]>;
}
