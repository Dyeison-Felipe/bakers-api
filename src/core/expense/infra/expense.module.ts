import { Module } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { ExpensePersistenceModule } from './expense-persistence.module';
import { ExpenseRepository } from '../domain/repositories/expense.repository';
import { ExpenseController } from './controller/expense.controller';
import { CreateExpenseUseCase } from '../application/usecases/create-expense.usecase';
import { UpdateExpenseUseCase } from '../application/usecases/update-expense.usecase';
import { DeleteExpenseUseCase } from '../application/usecases/delete-expense.usecase';
import { FindAllExpensesByCompanyUseCase } from '../application/usecases/find-all-expenses-by-company.usecase';

@Module({
  imports: [ExpensePersistenceModule],
  controllers: [ExpenseController],
  providers: [
    {
      provide: CreateExpenseUseCase,
      useFactory: (
        expenseRepository: ExpenseRepository,
        loggedUserService: LoggedUserService,
      ) => new CreateExpenseUseCase(expenseRepository, loggedUserService),
      inject: [PROVIDERS.EXPENSE_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
    {
      provide: UpdateExpenseUseCase,
      useFactory: (
        expenseRepository: ExpenseRepository,
        loggedUserService: LoggedUserService,
      ) => new UpdateExpenseUseCase(expenseRepository, loggedUserService),
      inject: [PROVIDERS.EXPENSE_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
    {
      provide: DeleteExpenseUseCase,
      useFactory: (
        expenseRepository: ExpenseRepository,
        loggedUserService: LoggedUserService,
      ) => new DeleteExpenseUseCase(expenseRepository, loggedUserService),
      inject: [PROVIDERS.EXPENSE_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
    {
      provide: FindAllExpensesByCompanyUseCase,
      useFactory: (
        expenseRepository: ExpenseRepository,
        loggedUserService: LoggedUserService,
      ) =>
        new FindAllExpensesByCompanyUseCase(
          expenseRepository,
          loggedUserService,
        ),
      inject: [PROVIDERS.EXPENSE_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
  ],
  exports: [ExpensePersistenceModule],
})
export class ExpenseModule {}
