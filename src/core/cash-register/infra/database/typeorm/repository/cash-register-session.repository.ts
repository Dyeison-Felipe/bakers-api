import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashRegisterSessionRepository } from '@/core/cash-register/domain/repositories/cash-register-session.repository';
import { CashRegisterSession } from '@/core/cash-register/domain/entities/cash-register-session.entity';
import {
  Pagination,
  PaginationInput,
} from '@/shared/domain/pagination/pagination';
import { TypeCashRegisterSessionStatus } from '@/shared/infra/enums/cash-register';
import { CashRegisterSessionSchema } from '../schema/cash-register-session.schema';
import { CashRegisterSessionMapper } from './mappers/cash-register-session.mapper';

export class CashRegisterSessionRepositoryImpl
  implements CashRegisterSessionRepository
{
  constructor(
    @InjectRepository(CashRegisterSessionSchema)
    private readonly cashRegisterSessionRepository: Repository<CashRegisterSessionSchema>,
  ) {}

  async save(entity: CashRegisterSession): Promise<CashRegisterSession> {
    const schema = CashRegisterSessionMapper.toSchema(entity);
    const saved = await this.cashRegisterSessionRepository.save(schema);
    return this.findById(saved.id) as Promise<CashRegisterSession>;
  }

  async findById(id: string): Promise<CashRegisterSession | null> {
    const schema = await this.cashRegisterSessionRepository.findOne({
      where: { id },
      relations: ['company'],
    });

    if (!schema) return null;

    return CashRegisterSessionMapper.toEntity(schema);
  }

  async findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<CashRegisterSession | null> {
    const schema = await this.cashRegisterSessionRepository.findOne({
      where: { id, company: { id: companyId } },
      relations: ['company'],
    });

    if (!schema) return null;

    return CashRegisterSessionMapper.toEntity(schema);
  }

  async findOpenByCompanyId(
    companyId: string,
  ): Promise<CashRegisterSession | null> {
    const schema = await this.cashRegisterSessionRepository.findOne({
      where: {
        company: { id: companyId },
        status: TypeCashRegisterSessionStatus.OPEN,
      },
      relations: ['company'],
    });

    if (!schema) return null;

    return CashRegisterSessionMapper.toEntity(schema);
  }

  async findAllByCompanyId(
    companyId: string,
    pagination?: PaginationInput,
  ): Promise<Pagination<CashRegisterSession>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const direction = pagination?.direction ?? 'DESC';

    const query = this.cashRegisterSessionRepository
      .createQueryBuilder('cashRegisterSession')
      .leftJoinAndSelect('cashRegisterSession.company', 'company')
      .where('company.id = :companyId', { companyId })
      .orderBy('cashRegisterSession.openedAt', direction)
      .skip((page - 1) * limit)
      .take(limit);

    const [schemas, totalItems] = await query.getManyAndCount();

    const items = schemas.map((schema) =>
      CashRegisterSessionMapper.toEntity(schema),
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

  async findAllByCompanyIdAndDateRange(
    companyId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<CashRegisterSession[]> {
    const schemas = await this.cashRegisterSessionRepository
      .createQueryBuilder('cashRegisterSession')
      .leftJoinAndSelect('cashRegisterSession.company', 'company')
      .where('company.id = :companyId', { companyId })
      .andWhere('cashRegisterSession.openedAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      })
      .orderBy('cashRegisterSession.openedAt', 'ASC')
      .getMany();

    return schemas.map((schema) => CashRegisterSessionMapper.toEntity(schema));
  }

  async update(entity: CashRegisterSession): Promise<void> {
    const schema = CashRegisterSessionMapper.toSchema(entity);
    await this.cashRegisterSessionRepository.save(schema);
  }

  async delete(id: string): Promise<void> {
    await this.cashRegisterSessionRepository.softDelete(id);
  }
}
