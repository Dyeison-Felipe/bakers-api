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
import { BatchMovementRepository } from '@/core/batch/domain/repositories/batch-movement.repository';
import { TypeBatchMovementReason } from '@/shared/infra/enums/batch';
import { TypeCashRegisterMovement } from '@/shared/infra/enums/cash-register';
import { CashRegisterSessionRepository } from '../../domain/repositories/cash-register-session.repository';
import { CashRegisterMovementRepository } from '../../domain/repositories/cash-register-movement.repository';

type Input = {
  id: string;
};

type Output = CashRegisterSessionDetailOutput;

const round2 = (value: number) => Math.round(value * 100) / 100;

const toDateOnly = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const toEndOfDay = (date: Date): Date =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );

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
    @Inject(PROVIDERS.BATCH_MOVEMENT_REPOSITORY)
    private readonly batchMovementRepository: BatchMovementRepository,
    @Inject(PROVIDERS.CASH_REGISTER_MOVEMENT_REPOSITORY)
    private readonly cashRegisterMovementRepository: CashRegisterMovementRepository,
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
    const endOfDay = toEndOfDay(session.openedAt);

    const [
      salesSummary,
      dailyProductions,
      expenses,
      totalWaste,
      totalRecoveredAtCost,
      totalSupplies,
      totalWithdrawals,
    ] = await Promise.all([
      this.saleItemRepository.sumRevenueAndCostByCashRegisterSessionId(
        session.id,
      ),
      this.dailyProductionRepository.findAllByCompanyId(companyId, {
        productionDate: day,
      }),
      this.expenseRepository.findAllByCompanyAndDate(companyId, day),
      this.batchMovementRepository.sumUnitCostByCompanyAndDateAndReason(
        companyId,
        day,
        endOfDay,
        TypeBatchMovementReason.WASTE,
      ),
      this.batchMovementRepository.sumUnitCostByCompanyAndDateAndReason(
        companyId,
        day,
        endOfDay,
        TypeBatchMovementReason.LEFTOVER_SOLD_AT_COST,
      ),
      this.cashRegisterMovementRepository.sumAmountByCashRegisterSessionIdAndType(
        session.id,
        TypeCashRegisterMovement.SUPPLY,
      ),
      this.cashRegisterMovementRepository.sumAmountByCashRegisterSessionIdAndType(
        session.id,
        TypeCashRegisterMovement.WITHDRAWAL,
      ),
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
      totalWaste: round2(totalWaste),
      totalRecoveredAtCost: round2(totalRecoveredAtCost),
      totalSupplies: round2(totalSupplies),
      totalWithdrawals: round2(totalWithdrawals),
      profit,
    };
  }
}
