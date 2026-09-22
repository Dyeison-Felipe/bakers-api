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
import { StockMovementRepository } from '@/core/stock-movement/domain/repositories/stock-movement.repository';
import { TypeStockMovementReason } from '@/shared/infra/enums/stock-movement';
import { TypeCashRegisterMovement } from '@/shared/infra/enums/cash-register';
import { TypeDailyProductionItemStatus } from '@/shared/infra/enums/daily-production';
import { CashRegisterSessionRepository } from '../../domain/repositories/cash-register-session.repository';
import { CashRegisterMovementRepository } from '../../domain/repositories/cash-register-movement.repository';
import { buildCashRegisterSessionDetail } from '../helpers/build-cash-register-session-detail';

type Input = {
  id: string;
};

type Output = CashRegisterSessionDetailOutput;

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
    @Inject(PROVIDERS.STOCK_MOVEMENT_REPOSITORY)
    private readonly stockMovementRepository: StockMovementRepository,
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
      this.stockMovementRepository.sumUnitCostByCompanyAndDateAndReason(
        companyId,
        sessionWindowStart,
        sessionWindowEnd,
        [TypeStockMovementReason.WASTE],
      ),
      this.stockMovementRepository.sumUnitCostByCompanyAndDateAndReason(
        companyId,
        sessionWindowStart,
        sessionWindowEnd,
        [TypeStockMovementReason.LEFTOVER_SOLD_AT_COST],
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

    const productionCostRaw = productionItemsByProduction
      .flat()
      .filter((item) => item.status === TypeDailyProductionItemStatus.PRODUCED)
      .reduce((sum, item) => sum + item.plannedCost, 0);

    return buildCashRegisterSessionDetail({
      session,
      totalRevenue: salesSummary.totalRevenue,
      costOfSold: salesSummary.totalCost,
      productionCostRaw,
      expenses: expenses.items,
      totalWaste,
      totalRecoveredAtCost,
      totalSupplies,
      totalWithdrawals,
    });
  }
}
