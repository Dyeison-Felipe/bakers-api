import { BaseRepository } from '@/shared/domain/repository/base-repository';
import {
  Pagination,
  PaginationInput,
} from '@/shared/domain/pagination/pagination';
import { Expense } from '../entities/expense.entity';

export type FindAllExpensesFilters = {
  dateFrom?: Date;
  dateTo?: Date;
};

export type ExpenseDayWindow = {
  id: string;
  dateFrom: Date;
  dateTo: Date;
};

export interface ExpenseRepository extends BaseRepository<Expense> {
  update(entity: Expense): Promise<void>;

  findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<Expense | null>;

  findAllByCompanyId(
    companyId: string,
    filters?: FindAllExpensesFilters,
    pagination?: PaginationInput,
  ): Promise<Pagination<Expense>>;

  findAllByCompanyAndDate(companyId: string, date: Date): Promise<Expense[]>;  findAllByCompanyAndDate(companyId: string, date: Date): Promise<Expense[]>;

  /** Despesas de várias janelas de dias (inclusive) numa única consulta,
   * agrupadas pela chave da janela e da mais recente para a mais antiga. Uma
   * despesa que cai em mais de uma janela aparece em todas. A comparação de
   * datas é feita no banco (coluna `date`), sem conversão de fuso em JS. */
  findAllByCompanyIdAndDayWindows(
    companyId: string,
    windows: ExpenseDayWindow[],
  ): Promise<Map<string, Expense[]>>;
}
