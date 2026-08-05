import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { ExpenseOutput } from '@/shared/application/output/expense/expense.output';
import { ExpenseRepository } from '../../domain/repositories/expense.repository';

type Input = {
  id: string;
  date: Date;
  value: number;
  description: string;
};

type Output = ExpenseOutput;

export class UpdateExpenseUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.EXPENSE_REPOSITORY)
    private readonly expenseRepository: ExpenseRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const expense = await this.expenseRepository.findByIdAndCompanyId(
      input.id,
      loggedUser.company.id,
    );

    if (!expense) {
      throw new NotFoundError('Despesa não encontrada');
    }

    expense.update({
      date: input.date,
      value: input.value,
      description: input.description,
      updatedBy: loggedUser.id,
    });

    await this.expenseRepository.update(expense);

    return {
      id: expense.id,
      date: expense.date,
      value: expense.value,
      description: expense.description,
    };
  }
}
