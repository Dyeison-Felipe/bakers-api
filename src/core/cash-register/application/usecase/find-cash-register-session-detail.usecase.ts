import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { CashRegisterSessionDetailOutput } from '@/shared/application/output/cash-register/cash-register-session-detail.output';
import { SaleItemRepository } from '@/core/sale/domain/repositories/sale-item.repository';
import { DailyProductionRepository } from '@/core/daily-production/domain/repositories/daily-production.repository';
import { DailyProductionItemRepository } from '@/core/daily-production/domain/repositories/daily-production-item.repository';
import { ExpenseRepository } from '@/core/expense/domain/repositories/expense.repository';
import { CashRegisterSessionRepository } from '../../domain/repositories/cash-register-session.repository';

type Input = {
  id: string;
};

type Output = CashRegisterSessionDetailOutput;

const round2 = (value: number) => Math.round(value * 100) / 100;

const toDateOnly = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export class FindCashRegisterSessionDetailUseCase
  implements UseCase<Input, Output>
{
  constructor(
    @Inject(PROVIDERS.CASH_REGISTER_SESSION_REPOSITORY)
    private readonly cashRegisterSessionRepository: CashRegisterSessionRepository,
    @Inject(PROVIDERS.SALE_ITEM_REPOSITORY)
    private readonly saleItemRepository: SaleItemRepository,
    @Inject(PROVIDERS.DAILY_PRODUCTION_REPOSITORY)
    private readonly dailyProductionRepository: DailyProductionRepository,
    @Inject(PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY)
    private readonly dailyProductionItemRepository: DailyProductionItemRepository,
    @Inject(PROVIDERS.EXPENSE_REPOSITORY)
    private readonly expenseRepository: ExpenseRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute({ id }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const companyId = loggedUser.company.id;

    const session = await this.cashRegisterSessionRepository.findByIdAndCompanyId(
      id,
      companyId,
    );

    if (!session) {
      throw new NotFoundError('Caixa não encontrado');
    }

    const day = toDateOnly(session.openedAt);

    const [salesSummary, dailyProductions, expenses] = await Promise.all([
      this.saleItemRepository.sumRevenueAndCostByCashRegisterSessionId(
        session.id,
      ),
      this.dailyProductionRepository.findAllByCompanyId(companyId, {
        productionDate: day,
      }),
      this.expenseRepository.findAllByCompanyAndDate(companyId, day),
    ]);

    const productionItemsByProduction = await Promise.all(
      dailyProductions.items.map((production) =>
        this.dailyProductionItemRepository.findAllByDailyProductionId(
          production.id,
        ),
      ),
    );

    const productionCost = round2(
      productionItemsByProduction
        .flat()
        .reduce((sum, item) => sum + item.plannedCost, 0),
    );

    const totalExpenses = round2(
      expenses.reduce((sum, expense) => sum + expense.value, 0),
    );

    const profit = round2(
      salesSummary.totalRevenue - salesSummary.totalCost - totalExpenses,
    );

    return {
      id: session.id,
      status: session.status,
      openingAmount: session.openingAmount,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      totalCash: session.totalCash,
      totalPix: session.totalPix,
      totalCard: session.totalCard,
      totalSales: round2(salesSummary.totalRevenue),
      costOfSold: round2(salesSummary.totalCost),
      productionCost,
      expenses: expenses.map((expense) => ({
        id: expense.id,
        date: expense.date,
        value: expense.value,
        description: expense.description,
      })),
      totalExpenses,
      profit,
    };
  }
}
