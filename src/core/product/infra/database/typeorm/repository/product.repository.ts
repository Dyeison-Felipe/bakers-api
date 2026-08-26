import { ProductRepository } from '@/core/product/domain/repositories/product.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductSchema } from '../schema/product.schema';
import {
  FindOptionsRelations,
  FindOptionsWhere,
  In,
  Not,
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
    name?: string,
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

    if (name) {
      query.andWhere('product.name ILIKE :name', { name: `%${name}%` });
    }

    query
      // Empate no createdAt (ex: seed em massa) deixa a ordem instável entre
      // páginas no Postgres — o id como critério de desempate garante uma
      // ordem determinística, sem duplicar/pular linhas ao paginar.
      .orderBy('product.createdAt', direction)
      .addOrderBy('product.id', 'ASC')
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

  async findEligibleForSale(
    companyId: string,
    search?: string,
    pagination?: PaginationInput,
  ): Promise<Pagination<Product>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.company', 'company')
      .where('company.id = :companyId', { companyId })
      .andWhere('product.active = :active', { active: true })
      .andWhere('product.typeProduct IN (:...typeProducts)', {
        typeProducts: [
          TypeProduct.OWN_PRODUCTION,
          TypeProduct.RESALE,
          TypeProduct.RAW_MATERIAL_AND_RESALE,
        ],
      });

    if (search) {
      query.andWhere(
        '(product.name ILIKE :search OR product.barCode ILIKE :search OR product.scaleReference ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    query
      .orderBy('product.name', 'ASC')
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

  async findLowStockByCompanyId(companyId: string): Promise<Product[]> {
    const productsSchema = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.company', 'company')
      .where('company.id = :companyId', { companyId })
      .andWhere('product.active = :active', { active: true })
      .andWhere('product.stockManagement = :stockManagement', {
        stockManagement: true,
      })
      .andWhere('product.currentStock IS NOT NULL')
      .andWhere('product.stockMin IS NOT NULL')
      .andWhere('product.currentStock <= product.stockMin')
      .orderBy('product.name', 'ASC')
      .getMany();

    return productsSchema.map((product) => ProductMapper.toEntity(product));
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

  async findProductByBarCodeAndCompanyId(
    barCode: string,
    companyId: string,
    excludeProductId?: string,
  ): Promise<Product | null> {
    const productSchema = await this.productRepository.findOne({
      where: {
        barCode,
        company: { id: companyId },
        ...(excludeProductId ? { id: Not(excludeProductId) } : {}),
      },
    });

    if (!productSchema) return null;

    return ProductMapper.toEntity(productSchema);
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
      relations: ['category', 'company'],
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
