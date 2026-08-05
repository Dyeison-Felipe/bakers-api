import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ExpenseRepository,
  FindAllExpensesFilters,
} from '@/core/expense/domain/repositories/expense.repository';
import { Expense } from '@/core/expense/domain/entities/expense.entity';
import {
  Pagination,
  PaginationInput,
} from '@/shared/domain/pagination/pagination';
import { formatDateOnly } from '@/shared/infra/utils/format-date-only';
import { ExpenseSchema } from '../schema/expense.schema';
import { ExpenseMapper } from './mappers/expense-mapper';

export class ExpenseRepositoryImpl implements ExpenseRepository {
  constructor(
    @InjectRepository(ExpenseSchema)
    private readonly expenseRepository: Repository<ExpenseSchema>,
  ) {}

  async save(entity: Expense): Promise<Expense> {
    const schema = ExpenseMapper.toSchema(entity);
    const saved = await this.expenseRepository.save(schema);
    return this.findById(saved.id) as Promise<Expense>;
  }

  async findById(id: string): Promise<Expense | null> {
    const schema = await this.expenseRepository.findOne({
      where: { id },
      relations: ['company'],
    });

    if (!schema) return null;

    return ExpenseMapper.toEntity(schema);
  }

  async findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<Expense | null> {
    const schema = await this.expenseRepository.findOne({
      where: { id, company: { id: companyId } },
      relations: ['company'],
    });

    if (!schema) return null;

    return ExpenseMapper.toEntity(schema);
  }

  async findAllByCompanyId(
    companyId: string,
    filters?: FindAllExpensesFilters,
    pagination?: PaginationInput,
  ): Promise<Pagination<Expense>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const direction = pagination?.direction ?? 'DESC';

    const query = this.expenseRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.company', 'company')
      .where('company.id = :companyId', { companyId });

    if (filters?.dateFrom) {
      query.andWhere('expense.date >= :dateFrom', {
        dateFrom: formatDateOnly(filters.dateFrom),
      });
    }

    if (filters?.dateTo) {
      query.andWhere('expense.date <= :dateTo', {
        dateTo: formatDateOnly(filters.dateTo),
      });
    }

    query
      .orderBy('expense.date', direction)
      .skip((page - 1) * limit)
      .take(limit);

    const [schemas, totalItems] = await query.getManyAndCount();

    const items = schemas.map((schema) => ExpenseMapper.toEntity(schema));

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

  async findAllByCompanyAndDate(
    companyId: string,
    date: Date,
  ): Promise<Expense[]> {
    const schemas = await this.expenseRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.company', 'company')
      .where('company.id = :companyId', { companyId })
      .andWhere('expense.date = :date', { date: formatDateOnly(date) })
      .orderBy('expense.createdAt', 'ASC')
      .getMany();

    return schemas.map((schema) => ExpenseMapper.toEntity(schema));
  }

  async update(entity: Expense): Promise<void> {
    const schema = ExpenseMapper.toSchema(entity);
    await this.expenseRepository.save(schema);
  }

  async delete(id: string): Promise<void> {
    await this.expenseRepository.softDelete(id);
  }
}
