import { ProductRepository } from '@/core/product/domain/repositories/product.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductSchema } from '../schema/product.schema';
import {
  FindOptionsRelations,
  FindOptionsWhere,
  In,
  Repository,
} from 'typeorm';
import { Product } from '@/core/product/domain/entities/product.entity';
import { ProductMapper } from './mappers/product.mapper';
import {
  Pagination,
  PaginationInput,
} from '@/shared/domain/pagination/pagination';
import { TypeProduct } from '@/shared/infra/enums/product';

export class ProductRepositoryImpl implements ProductRepository {
  constructor(
    @InjectRepository(ProductSchema)
    private readonly productRepository: Repository<ProductSchema>,
  ) {}

  async findAllByIdsAndCompanyId(
    ids: string[],
    companyId: string,
  ): Promise<Product[]> {
    const productsSchema = await this.productRepository.find({
      where: { id: In(ids), company: { id: companyId } },
      relations: this.getRelations(),
    });

    return productsSchema.map((schema) => ProductMapper.toEntity(schema));
  }

  async findProductByIdAndCompanyId(
    productId: string,
    companyId: string,
  ): Promise<Product | null> {
    const productSchema = await this.productRepository.findOne({
      where: { id: productId, company: { id: companyId } },
      relations: ['category', 'company'],
    });

    if (!productSchema) return null;

    const productEntity = ProductMapper.toEntity(productSchema);

    return productEntity;
  }

  async findAllProductsByCompanyId(
    companyId: string,
    status?: boolean,
    categoryId?: string,
    typeProduct?: TypeProduct,
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

    if (status !== undefined) {
      query.andWhere('product.active = :active', { active: status });
    }

    if (categoryId) {
      query.andWhere('category.id = :categoryId', { categoryId });
    }

    if (typeProduct) {
      query.andWhere('product.typeProduct = :typeProduct', { typeProduct });
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

  async update(entity: Product): Promise<void> {
    const schema = ProductMapper.toUpdateSchema(entity);

    await this.productRepository.save(schema);
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

  private getRelations(): FindOptionsRelations<ProductSchema> {
    return {
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
      category: {
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
      },
    };
  }
}
