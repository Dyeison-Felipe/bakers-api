import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DailyProductionRepository,
  FindAllDailyProductionsFilters,
} from '@/core/daily-production/domain/repositories/daily-production.repository';
import { DailyProduction } from '@/core/daily-production/domain/entities/daily-production.entity';
import {
  Pagination,
  PaginationInput,
} from '@/shared/domain/pagination/pagination';
import { formatDateOnly } from '@/shared/infra/utils/format-date-only';
import { DailyProductionSchema } from '../schema/daily-production.schema';
import { DailyProductionMapper } from './mappers/daily-production.mapper';

export class DailyProductionRepositoryImpl implements DailyProductionRepository {
  constructor(
    @InjectRepository(DailyProductionSchema)
    private readonly dailyProductionRepository: Repository<DailyProductionSchema>,
  ) {}

  async save(entity: DailyProduction): Promise<DailyProduction> {
    const schema = DailyProductionMapper.toSchema(entity);
    const saved = await this.dailyProductionRepository.save(schema);
    return this.findById(saved.id) as Promise<DailyProduction>;
  }

  async findById(id: string): Promise<DailyProduction | null> {
    const schema = await this.dailyProductionRepository.findOne({
      where: { id },
      relations: ['company'],
    });

    if (!schema) return null;

    return DailyProductionMapper.toEntity(schema);
  }

  async findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<DailyProduction | null> {
    const schema = await this.dailyProductionRepository.findOne({
      where: { id, company: { id: companyId } },
      relations: ['company'],
    });

    if (!schema) return null;

    return DailyProductionMapper.toEntity(schema);
  }

  async findAllByCompanyId(
    companyId: string,
    filters?: FindAllDailyProductionsFilters,
    pagination?: PaginationInput,
  ): Promise<Pagination<DailyProduction>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const direction = pagination?.direction ?? 'DESC';

    const query = this.dailyProductionRepository
      .createQueryBuilder('dailyProduction')
      .leftJoinAndSelect('dailyProduction.company', 'company')
      .where('company.id = :companyId', { companyId });

    if (filters?.status) {
      query.andWhere('dailyProduction.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.productionDate) {
      query.andWhere('dailyProduction.productionDate = :productionDate', {
        productionDate: formatDateOnly(filters.productionDate),
      });
    }

    if (filters?.productionDateFrom) {
      query.andWhere('dailyProduction.productionDate >= :productionDateFrom', {
        productionDateFrom: formatDateOnly(filters.productionDateFrom),
      });
    }

    if (filters?.productionDateTo) {
      query.andWhere('dailyProduction.productionDate <= :productionDateTo', {
        productionDateTo: formatDateOnly(filters.productionDateTo),
      });
    }

    query
      .orderBy('dailyProduction.productionDate', direction)
      .skip((page - 1) * limit)
      .take(limit);

    const [schemas, totalItems] = await query.getManyAndCount();

    const items = schemas.map((schema) => DailyProductionMapper.toEntity(schema));

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

  async update(entity: DailyProduction): Promise<void> {
    const schema = DailyProductionMapper.toSchema(entity);
    await this.dailyProductionRepository.save(schema);
  }

  async delete(id: string): Promise<void> {
    await this.dailyProductionRepository.softDelete(id);
  }
}
