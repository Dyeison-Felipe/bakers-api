import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { PaginationOutput } from '@/shared/application/output/pagination/pagination.output';
import { ExpenseOutput } from '@/shared/application/output/expense/expense.output';
import { ExpenseRepository } from '../../domain/repositories/expense.repository';

type Input = {
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
};

type Output = PaginationOutput<ExpenseOutput>;

export class FindAllExpensesByCompanyUseCase
  implements UseCase<Input, Output>
{
  constructor(
    @Inject(PROVIDERS.EXPENSE_REPOSITORY)
    private readonly expenseRepository: ExpenseRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const expenses = await this.expenseRepository.findAllByCompanyId(
      loggedUser.company.id,
      {
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
      },
      {
        page: input.page,
        limit: input.limit,
      },
    );

    const items = expenses.items.map((expense) => ({
      id: expense.id,
      date: expense.date,
      value: expense.value,
      description: expense.description,
    }));

    return {
      items,
      meta: expenses.meta,
    };
  }
}
