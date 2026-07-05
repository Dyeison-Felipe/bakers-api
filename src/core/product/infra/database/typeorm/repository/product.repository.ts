import { ProductRepository } from '@/core/product/domain/repositories/product.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductSchema } from '../schema/product.schema';
import { Repository } from 'typeorm';
import { Product } from '@/core/product/domain/entities/product.entity';
import { ProductMapper } from './product.mapper';

export class ProductRepositoryImpl implements ProductRepository {
  constructor(
    @InjectRepository(ProductSchema)
    private readonly productRepository: Repository<ProductSchema>,
  ) {}

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

  async delete(id: string): Promise<void> {
    await this.productRepository.softDelete(id);
  }
}
