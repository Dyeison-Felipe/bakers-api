import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ExpenseRepository,
  FindAllExpensesFilters,
} from '@/core/expense/domain/repositories/expense.repository';
import { Expense } from '@/core/expense/domain/entities/expense.entity';
import { ExpenseDayWindow } from '@/core/expense/domain/repositories/expense.repository';
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

  async findAllByCompanyIdAndDayWindows(
    companyId: string,
    windows: ExpenseDayWindow[],
  ): Promise<Map<string, Expense[]>> {
    const byWindow = new Map<string, Expense[]>();

    if (windows.length === 0) return byWindow;

    // Mesmas datas (YYYY-MM-DD) e mesma comparação por coluna `date` do filtro
    // individual de `findAllByCompanyId`.
    const parameters: Record<string, unknown> = { companyId };
    const rowsSql = windows.map((window, index) => {
      parameters[`windowId${index}`] = window.id;
      parameters[`windowFrom${index}`] = formatDateOnly(window.dateFrom);
      parameters[`windowTo${index}`] = formatDateOnly(window.dateTo);

      return `(CAST(:windowId${index} AS uuid), CAST(:windowFrom${index} AS date), CAST(:windowTo${index} AS date))`;
    });

    const pairs = await this.expenseRepository
      .createQueryBuilder('expense')
      .innerJoin('expense.company', 'company')
      .innerJoin(
        `(SELECT w.id, w.date_from, w.date_to FROM (VALUES ${rowsSql.join(', ')}) AS w(id, date_from, date_to))`,
        'win',
        'expense.date BETWEEN win.date_from AND win.date_to',
      )
      .select('win.id', 'windowId')
      .addSelect('expense.id', 'expenseId')
      .where('company.id = :companyId')
      .setParameters(parameters)
      // Despesas na mesma data: createdAt/id como desempate mantém a ordem
      // estável entre chamadas (sem isso o Postgres pode alternar a ordem).
      .orderBy('expense.date', 'DESC')
      .addOrderBy('expense.createdAt', 'ASC')
      .addOrderBy('expense.id', 'ASC')
      .getRawMany<{ windowId: string; expenseId: string }>();

    if (pairs.length === 0) return byWindow;

    const expenseIds = [...new Set(pairs.map((pair) => pair.expenseId))];

    const schemas = await this.expenseRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.company', 'company')
      .where('expense.id IN (:...expenseIds)', { expenseIds })
      .getMany();

    const expensesById = new Map(
      schemas.map((schema) => [schema.id, ExpenseMapper.toEntity(schema)]),
    );

    pairs.forEach(({ windowId, expenseId }) => {
      const expense = expensesById.get(expenseId);

      if (!expense) return;

      const list = byWindow.get(windowId) ?? [];
      list.push(expense);
      byWindow.set(windowId, list);
    });

    return byWindow;
  }

  async update(entity: Expense): Promise<void> {
    const schema = ExpenseMapper.toSchema(entity);
    await this.expenseRepository.save(schema);
  }

  async delete(id: string): Promise<void> {
    await this.expenseRepository.softDelete(id);
  }
}
