import { BaseRepository } from "@/shared/domain/repository/base-repository";
import { Product } from "../entities/product.entity";

export interface ProductRepository extends BaseRepository<Product> {
  findProductByNameAndCompanyId(name: string, companyId: string): Promise<Product | null>;
  findAllProductsByCompanyIdAndFilterCategoryId(companyId: string, categoryId?: string): Promise<Product[]>
}