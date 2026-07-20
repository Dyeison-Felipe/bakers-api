import { ProductRepository } from '@/core/product/domain/repositories/product.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductSchema } from '../schema/product.schema';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { Product } from '@/core/product/domain/entities/product.entity';
import { ProductMapper } from './product.mapper';
import {
  Pagination,
  PaginationInput,
} from '@/shared/domain/pagination/pagination';

export class ProductRepositoryImpl implements ProductRepository {
  constructor(
    @InjectRepository(ProductSchema)
    private readonly productRepository: Repository<ProductSchema>,
  ) {}

  async findAllProductsByCompanyIdAndFilterCategoryId(
    companyId: string,
    categoryId?: string,
    pagination?: PaginationInput,
  ): Promise<Pagination<Product>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 100;
    const direction = pagination?.direction ?? 'DESC';

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.company', 'company')
      .where('company.id = :companyId', { companyId });

    if (categoryId) {
      query.andWhere('category.id = :categoryId', { categoryId });
    }

    query
      .orderBy('product.createdAt', direction)
      .skip((page - 1) * limit)
      .take(limit);

    const [productsSchema, totalItems] = await query.getManyAndCount();

    const items = productsSchema.map((product) =>
      ProductMapper.toEntity(product),
    );

    return {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async findProductByNameAndCompanyId(
    name: string,
    companyId: string,
  ): Promise<Product | null> {
    const productSchema = await this.productRepository.findOne({
      where: { name: name, company: { id: companyId } },
    });

    if (!productSchema) return null;

    const productEntity = ProductMapper.toEntity(productSchema);

    return productEntity;
  }

  async save(entity: Product): Promise<Product> {
    const schema = ProductMapper.toSchema(entity);

    const saveSchema = await this.productRepository.save(schema);

    const productEntity = ProductMapper.toEntity(saveSchema);

    return productEntity;
  }

  async findById(id: string): Promise<Product | null> {
    const productSchema = await this.productRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!productSchema) return null;

    const productEntity = ProductMapper.toEntity(productSchema);

    return productEntity;
  }

  async update(entity: Product): Promise<Product> {
    const schema = ProductMapper.toSchema(entity);

    const saveSchema = await this.productRepository.save(schema);

    const productEntity = ProductMapper.toEntity(saveSchema);

    return productEntity;
  }

  async existsByCategoryIds(
    categoryIds: string[],
    companyId: string,
  ): Promise<boolean> {
    const count = await this.productRepository.count({
      where: {
        category: { id: In(categoryIds) },
        company: { id: companyId },
      },
    });

    return count > 0;
  }

  async delete(id: string): Promise<void> {
    await this.productRepository.softDelete(id);
  }
}
