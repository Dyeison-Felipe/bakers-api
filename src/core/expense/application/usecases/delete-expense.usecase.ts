import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { ExpenseRepository } from '../../domain/repositories/expense.repository';

type Input = {
  id: string;
};

type Output = void;

export class DeleteExpenseUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.EXPENSE_REPOSITORY)
    private readonly expenseRepository: ExpenseRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute({ id }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const expense = await this.expenseRepository.findByIdAndCompanyId(
      id,
      loggedUser.company.id,
    );

    if (!expense) {
      throw new NotFoundError('Despesa não encontrada');
    }

    await this.expenseRepository.delete(id);
  }
}
