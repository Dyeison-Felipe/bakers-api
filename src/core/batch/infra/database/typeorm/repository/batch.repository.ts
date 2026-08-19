import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BatchRepository,
  FindAllBatchesFilters,
} from '@/core/batch/domain/repositories/batch.repository';
import { Batch } from '@/core/batch/domain/entities/batch.entity';
import {
  Pagination,
  PaginationInput,
} from '@/shared/domain/pagination/pagination';
import { formatDateOnly } from '@/shared/infra/utils/format-date-only';
import { BatchSchema } from '../schema/batch.schema';
import { BatchMapper } from './mappers/batch.mapper';

export class BatchRepositoryImpl implements BatchRepository {
  constructor(
    @InjectRepository(BatchSchema)
    private readonly batchRepository: Repository<BatchSchema>,
  ) {}

  async save(entity: Batch): Promise<Batch> {
    const schema = BatchMapper.toSchema(entity);
    const saved = await this.batchRepository.save(schema);
    return this.findById(saved.id) as Promise<Batch>;
  }

  async findById(id: string): Promise<Batch | null> {
    const schema = await this.batchRepository.findOne({
      where: { id },
      relations: ['product', 'product.category', 'company'],
    });

    if (!schema) return null;

    return BatchMapper.toEntity(schema);
  }

  async findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<Batch | null> {
    const schema = await this.batchRepository.findOne({
      where: { id, company: { id: companyId } },
      relations: ['product', 'product.category', 'company'],
    });

    if (!schema) return null;

    return BatchMapper.toEntity(schema);
  }

  async findAllByCompanyId(
    companyId: string,
    filters?: FindAllBatchesFilters,
    pagination?: PaginationInput,
  ): Promise<Pagination<Batch>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const direction = pagination?.direction ?? 'DESC';

    const query = this.batchRepository
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.product', 'product')
      .leftJoinAndSelect('batch.company', 'company')
      .where('company.id = :companyId', { companyId });

    if (filters?.productId) {
      query.andWhere('product.id = :productId', {
        productId: filters.productId,
      });
    }

    if (filters?.productName) {
      query.andWhere('product.name ILIKE :productName', {
        productName: `%${filters.productName}%`,
      });
    }

    if (filters?.onlyAvailable) {
      query.andWhere('batch.remainingQuantity > 0');
    }

    if (filters?.producedOn) {
      query.andWhere('batch.productionDate = :producedOn', {
        producedOn: formatDateOnly(filters.producedOn),
      });
    }

    query
      // Empate no createdAt deixa a ordem instável entre páginas no
      // Postgres — o id como critério de desempate garante ordem
      // determinística, sem duplicar/pular linhas ao paginar.
      .orderBy('batch.createdAt', direction)
      .addOrderBy('batch.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [schemas, totalItems] = await query.getManyAndCount();

    const items = schemas.map((schema) => BatchMapper.toEntity(schema));

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

  async findAvailableByProductIdOrderByExpiration(
    productId: string,
    companyId: string,
  ): Promise<Batch[]> {
    const schemas = await this.batchRepository
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.product', 'product')
      .leftJoinAndSelect('batch.company', 'company')
      .where('company.id = :companyId', { companyId })
      .andWhere('product.id = :productId', { productId })
      .andWhere('batch.remainingQuantity > 0')
      .orderBy('batch.expirationDate', 'ASC', 'NULLS LAST')
      .addOrderBy('batch.createdAt', 'ASC')
      .getMany();

    return schemas.map((schema) => BatchMapper.toEntity(schema));
  }

  async update(entity: Batch): Promise<void> {
    const schema = BatchMapper.toSchema(entity);
    await this.batchRepository.save(schema);
  }

  async delete(id: string): Promise<void> {
    await this.batchRepository.softDelete(id);
  }
}
