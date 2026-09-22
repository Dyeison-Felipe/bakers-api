import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { CashRegisterSessionRepository } from '@/core/cash-register/domain/repositories/cash-register-session.repository';
import { CashRegisterMovementRepository } from '@/core/cash-register/domain/repositories/cash-register-movement.repository';
import {
  buildCashRegisterSessionDetail,
  round2,
} from '@/core/cash-register/application/helpers/build-cash-register-session-detail';
import { SaleItemRepository } from '@/core/sale/domain/repositories/sale-item.repository';
import { DailyProductionItemRepository } from '@/core/daily-production/domain/repositories/daily-production-item.repository';
import { ExpenseRepository } from '@/core/expense/domain/repositories/expense.repository';
import { StockMovementRepository } from '@/core/stock-movement/domain/repositories/stock-movement.repository';
import { TypeStockMovementReason } from '@/shared/infra/enums/stock-movement';
import { TypeCashRegisterMovement } from '@/shared/infra/enums/cash-register';
import { CashRegisterReportOutput } from '@/shared/application/output/report/cash-register-report.output';

type Input = {
  dateFrom: Date;
  dateTo: Date;
};

type Output = CashRegisterReportOutput;

// Mesmo teto por sessão que o detalhe individual aplicava à lista de despesas.
const MAX_EXPENSES_PER_SESSION = 1000;

const toDateOnly = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * Relatório de caixa por período. Cada sessão é calculada com a MESMA fórmula
 * do detalhe individual (`buildCashRegisterSessionDetail`), mas os dados são
 * buscados em lote — uma query por fonte para todas as sessões do período —
 * em vez de uma rodada de queries por sessão (N+1).
 */
export class FindCashRegisterReportUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.CASH_REGISTER_SESSION_REPOSITORY)
    private readonly cashRegisterSessionRepository: CashRegisterSessionRepository,
    @Inject(PROVIDERS.CASH_REGISTER_MOVEMENT_REPOSITORY)
    private readonly cashRegisterMovementRepository: CashRegisterMovementRepository,
    @Inject(PROVIDERS.SALE_ITEM_REPOSITORY)
    private readonly saleItemRepository: SaleItemRepository,
    @Inject(PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY)
    private readonly dailyProductionItemRepository: DailyProductionItemRepository,
    @Inject(PROVIDERS.EXPENSE_REPOSITORY)
    private readonly expenseRepository: ExpenseRepository,
    @Inject(PROVIDERS.STOCK_MOVEMENT_REPOSITORY)
    private readonly stockMovementRepository: StockMovementRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute({ dateFrom, dateTo }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const companyId = loggedUser.company.id;

    const sessions =
      await this.cashRegisterSessionRepository.findAllByCompanyIdAndDateRange(
        companyId,
        dateFrom,
        dateTo,
      );

    const sessionIds = sessions.map((session) => session.id);
    const now = new Date();

    // Um caixa pode ficar aberto por vários dias — todo cálculo usa a janela
    // real da sessão inteira (abertura até fechamento, ou até agora se ainda
    // estiver aberto), igual ao detalhe individual.
    const timeWindows = sessions.map((session) => ({
      id: session.id,
      dateFrom: session.openedAt,
      dateTo: session.closedAt ?? now,
    }));

    const dayWindows = sessions.map((session) => ({
      id: session.id,
      dateFrom: toDateOnly(session.openedAt),
      dateTo: toDateOnly(session.closedAt ?? now),
    }));

    const [
      salesBySession,
      productionCostBySession,
      expensesBySession,
      wasteBySession,
      recoveredBySession,
      suppliesBySession,
      withdrawalsBySession,
    ] = await Promise.all([
      this.saleItemRepository.sumRevenueAndCostByCashRegisterSessionIds(
        sessionIds,
      ),
      this.dailyProductionItemRepository.sumProducedPlannedCostByCompanyAndWindows(
        companyId,
        dayWindows,
      ),
      this.expenseRepository.findAllByCompanyIdAndDayWindows(
        companyId,
        dayWindows,
      ),
      this.stockMovementRepository.sumUnitCostByCompanyAndWindowsAndReason(
        companyId,
        timeWindows,
        [TypeStockMovementReason.WASTE],
      ),
      this.stockMovementRepository.sumUnitCostByCompanyAndWindowsAndReason(
        companyId,
        timeWindows,
        [TypeStockMovementReason.LEFTOVER_SOLD_AT_COST],
      ),
      this.cashRegisterMovementRepository.sumAmountByCashRegisterSessionIdsAndType(
        sessionIds,
        TypeCashRegisterMovement.SUPPLY,
      ),
      this.cashRegisterMovementRepository.sumAmountByCashRegisterSessionIdsAndType(
        sessionIds,
        TypeCashRegisterMovement.WITHDRAWAL,
      ),
    ]);

    const sessionDetails = sessions.map((session) => {
      // Despesas da janela de dias da sessão (já da mais recente pra mais
      // antiga), com o mesmo teto por sessão do detalhe individual.
      const sessionExpenses = (expensesBySession.get(session.id) ?? []).slice(
        0,
        MAX_EXPENSES_PER_SESSION,
      );

      const sales = salesBySession.get(session.id);

      return buildCashRegisterSessionDetail({
        session,
        totalRevenue: sales?.totalRevenue ?? 0,
        costOfSold: sales?.totalCost ?? 0,
        productionCostRaw: productionCostBySession.get(session.id) ?? 0,
        expenses: sessionExpenses,
        totalWaste: wasteBySession.get(session.id) ?? 0,
        totalRecoveredAtCost: recoveredBySession.get(session.id) ?? 0,
        totalSupplies: suppliesBySession.get(session.id) ?? 0,
        totalWithdrawals: withdrawalsBySession.get(session.id) ?? 0,
      });
    });

    const summary = sessionDetails.reduce(
      (acc, detail) => ({
        sessionsCount: acc.sessionsCount + 1,
        totalOpeningAmount: round2(acc.totalOpeningAmount + detail.openingAmount),
        totalSales: round2(acc.totalSales + detail.totalSales),
        costOfSold: round2(acc.costOfSold + detail.costOfSold),
        totalProductionCost: round2(
          acc.totalProductionCost + detail.productionCost,
        ),
        totalExpenses: round2(acc.totalExpenses + detail.totalExpenses),
        totalWaste: round2(acc.totalWaste + detail.totalWaste),
        totalRecoveredAtCost: round2(
          acc.totalRecoveredAtCost + detail.totalRecoveredAtCost,
        ),
        totalSupplies: round2(acc.totalSupplies + detail.totalSupplies),
        totalWithdrawals: round2(acc.totalWithdrawals + detail.totalWithdrawals),
        totalProfit: round2(acc.totalProfit + detail.profit),
      }),
      {
        sessionsCount: 0,
        totalOpeningAmount: 0,
        totalSales: 0,
        costOfSold: 0,
        totalProductionCost: 0,
        totalExpenses: 0,
        totalWaste: 0,
        totalRecoveredAtCost: 0,
        totalSupplies: 0,
        totalWithdrawals: 0,
        totalProfit: 0,
      },
    );

    return {
      summary,
      sessions: sessionDetails,
    };
  }
}
