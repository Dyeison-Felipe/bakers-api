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

  findAllByCompanyAndDate(companyId: string, date: Date): Promise<Expense[]>;
}
