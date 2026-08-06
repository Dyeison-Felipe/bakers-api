import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FindAllSalesFilters,
  SaleRepository,
} from '@/core/sale/domain/repositories/sale.repository';
import { Sale } from '@/core/sale/domain/entities/sale.entity';
import {
  Pagination,
  PaginationInput,
} from '@/shared/domain/pagination/pagination';
import { TypePaymentMethod } from '@/shared/infra/enums/sale';
import { SaleSchema } from '../schema/sale.schema';
import { SaleMapper } from './mappers/sale.mapper';

export class SaleRepositoryImpl implements SaleRepository {
  constructor(
    @InjectRepository(SaleSchema)
    private readonly saleRepository: Repository<SaleSchema>,
  ) {}

  async save(entity: Sale): Promise<Sale> {
    const schema = SaleMapper.toSchema(entity);
    const saved = await this.saleRepository.save(schema);
    return this.findById(saved.id) as Promise<Sale>;
  }

  async findById(id: string): Promise<Sale | null> {
    const schema = await this.saleRepository.findOne({
      where: { id },
      relations: ['company', 'cashRegisterSession'],
    });

    if (!schema) return null;

    return SaleMapper.toEntity(schema);
  }

  async findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<Sale | null> {
    const schema = await this.saleRepository.findOne({
      where: { id, company: { id: companyId } },
      relations: ['company', 'cashRegisterSession'],
    });

    if (!schema) return null;

    return SaleMapper.toEntity(schema);
  }

  async findAllByCompanyId(
    companyId: string,
    filters?: FindAllSalesFilters,
    pagination?: PaginationInput,
  ): Promise<Pagination<Sale>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const direction = pagination?.direction ?? 'DESC';

    const query = this.saleRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.company', 'company')
      .leftJoinAndSelect('sale.cashRegisterSession', 'cashRegisterSession')
      .where('company.id = :companyId', { companyId });

    if (filters?.cashRegisterSessionId) {
      query.andWhere('cashRegisterSession.id = :cashRegisterSessionId', {
        cashRegisterSessionId: filters.cashRegisterSessionId,
      });
    }

    query
      .orderBy('sale.createdAt', direction)
      .skip((page - 1) * limit)
      .take(limit);

    const [schemas, totalItems] = await query.getManyAndCount();

    const items = schemas.map((schema) => SaleMapper.toEntity(schema));

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

  async sumTotalByCashRegisterSessionAndPaymentMethod(
    cashRegisterSessionId: string,
    paymentMethod: TypePaymentMethod,
  ): Promise<number> {
    const result = await this.saleRepository
      .createQueryBuilder('sale')
      .leftJoin('sale.cashRegisterSession', 'cashRegisterSession')
      .select('COALESCE(SUM(sale.totalAmount), 0)', 'total')
      .where('cashRegisterSession.id = :cashRegisterSessionId', {
        cashRegisterSessionId,
      })
      .andWhere('sale.paymentMethod = :paymentMethod', { paymentMethod })
      .getRawOne<{ total: string }>();

    return Number(result?.total ?? 0);
  }

  async sumTotalByCompanyAndDateRangeAndPaymentMethod(
    companyId: string,
    dateFrom: Date,
    dateTo: Date,
    paymentMethod: TypePaymentMethod,
  ): Promise<number> {
    const result = await this.saleRepository
      .createQueryBuilder('sale')
      .leftJoin('sale.company', 'company')
      .select('COALESCE(SUM(sale.totalAmount), 0)', 'total')
      .where('company.id = :companyId', { companyId })
      .andWhere('sale.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      })
      .andWhere('sale.paymentMethod = :paymentMethod', { paymentMethod })
      .getRawOne<{ total: string }>();

    return Number(result?.total ?? 0);
  }

  async update(entity: Sale): Promise<void> {
    const schema = SaleMapper.toSchema(entity);
    await this.saleRepository.save(schema);
  }

  async delete(id: string): Promise<void> {
    await this.saleRepository.softDelete(id);
  }
}
