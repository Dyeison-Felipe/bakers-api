import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { ExpenseSchema } from './database/typeorm/schema/expense.schema';
import { ExpenseRepositoryImpl } from './database/typeorm/repositories/expense.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ExpenseSchema])],
  providers: [
    {
      provide: PROVIDERS.EXPENSE_REPOSITORY,
      useClass: ExpenseRepositoryImpl,
    },
  ],
  exports: [PROVIDERS.EXPENSE_REPOSITORY],
})
export class ExpensePersistenceModule {}
