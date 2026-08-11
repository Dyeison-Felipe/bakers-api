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
import { TypeDailyProductionItemStatus } from '@/shared/infra/enums/daily-production';
import { CashRegisterSessionRepository } from '../../domain/repositories/cash-register-session.repository';
import { CashRegisterMovementRepository } from '../../domain/repositories/cash-register-movement.repository';

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

    // Um caixa pode ficar aberto por vários dias (ex: abre segunda, fecha
    // sábado) — todo cálculo do detalhe usa a janela real da sessão inteira
    // (abertura até fechamento, ou até agora se ainda estiver aberto), nunca
    // só o dia calendário da abertura.
    const sessionWindowStart = session.openedAt;
    const sessionWindowEnd = session.closedAt ?? new Date();
    const sessionDayFrom = toDateOnly(sessionWindowStart);
    const sessionDayTo = toDateOnly(sessionWindowEnd);

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
      this.dailyProductionRepository.findAllByCompanyId(
        companyId,
        { productionDateFrom: sessionDayFrom, productionDateTo: sessionDayTo },
        { limit: 1000 },
      ),
      this.expenseRepository.findAllByCompanyId(
        companyId,
        { dateFrom: sessionDayFrom, dateTo: sessionDayTo },
        { limit: 1000 },
      ),
      this.batchMovementRepository.sumUnitCostByCompanyAndDateAndReason(
        companyId,
        sessionWindowStart,
        sessionWindowEnd,
        TypeBatchMovementReason.WASTE,
      ),
      this.batchMovementRepository.sumUnitCostByCompanyAndDateAndReason(
        companyId,
        sessionWindowStart,
        sessionWindowEnd,
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
        .filter((item) => item.status === TypeDailyProductionItemStatus.PRODUCED)
        .reduce((sum, item) => sum + item.plannedCost, 0),
    );

    const totalExpenses = round2(
      expenses.items.reduce((sum, expense) => sum + expense.value, 0),
    );

    // Lucro real = vendas (+ o que foi recuperado vendendo sobra ao custo,
    // já que isso não é perda) − custo do que foi efetivamente produzido −
    // valor perdido em descarte − despesas do dia.
    const profit = round2(
      salesSummary.totalRevenue +
        totalRecoveredAtCost -
        productionCost -
        totalWaste -
        totalExpenses,
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
      expenses: expenses.items.map((expense) => ({
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
