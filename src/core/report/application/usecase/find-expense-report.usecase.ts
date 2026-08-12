import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { ExpenseRepository } from '@/core/expense/domain/repositories/expense.repository';
import {
  ExpenseReportDailyPoint,
  ExpenseReportItem,
  ExpenseReportOutput,
} from '@/shared/application/output/report/expense-report.output';

type Input = {
  dateFrom: Date;
  dateTo: Date;
};

type Output = ExpenseReportOutput;

const round2 = (value: number) => Math.round(value * 100) / 100;

const toDayKey = (date: Date): string => date.toISOString().slice(0, 10);

export class FindExpenseReportUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.EXPENSE_REPOSITORY)
    private readonly expenseRepository: ExpenseRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute({ dateFrom, dateTo }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const companyId = loggedUser.company.id;

    const expenses = await this.expenseRepository.findAllByCompanyId(
      companyId,
      { dateFrom, dateTo },
      { limit: 1000 },
    );

    const items: ExpenseReportItem[] = expenses.items.map((expense) => ({
      id: expense.id,
      date: expense.date,
      value: expense.value,
      description: expense.description,
    }));

    const total = round2(items.reduce((sum, item) => sum + item.value, 0));

    const dailyMap = new Map<string, number>();
    for (const item of items) {
      const day = toDayKey(item.date);
      dailyMap.set(day, round2((dailyMap.get(day) ?? 0) + item.value));
    }
    const dailySeries: ExpenseReportDailyPoint[] = Array.from(
      dailyMap.entries(),
    )
      .map(([day, dayTotal]) => ({ day, total: dayTotal }))
      .sort((a, b) => a.day.localeCompare(b.day));

    return {
      total,
      dailySeries,
      items,
    };
  }
}
