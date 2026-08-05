import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { ExpenseOutput } from '@/shared/application/output/expense/expense.output';
import { ExpenseRepository } from '../../domain/repositories/expense.repository';
import { Expense } from '../../domain/entities/expense.entity';

type Input = {
  date: Date;
  value: number;
  description: string;
};

type Output = ExpenseOutput;

export class CreateExpenseUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.EXPENSE_REPOSITORY)
    private readonly expenseRepository: ExpenseRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const expense = Expense.create({
      company: loggedUser.company,
      date: input.date,
      value: input.value,
      description: input.description,
      createdBy: loggedUser.id,
    });

    const saved = await this.expenseRepository.save(expense);

    return {
      id: saved.id,
      date: saved.date,
      value: saved.value,
      description: saved.description,
    };
  }
}
