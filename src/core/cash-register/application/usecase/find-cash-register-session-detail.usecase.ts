import { Inject } from '@nestjs/common';
import { startOfBusinessDay } from '@/shared/infra/utils/business-date';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { FindCashRegisterSessionDetailOutput } from '@/shared/application/output/cash-register/cash-register-session-detail.output';
import { SaleRepository } from '@/core/sale/domain/repositories/sale.repository';
import { SaleItemRepository } from '@/core/sale/domain/repositories/sale-item.repository';
import { DailyProductionRepository } from '@/core/daily-production/domain/repositories/daily-production.repository';
import { DailyProductionItemRepository } from '@/core/daily-production/domain/repositories/daily-production-item.repository';
import { ExpenseRepository } from '@/core/expense/domain/repositories/expense.repository';
import { StockMovementRepository } from '@/core/stock-movement/domain/repositories/stock-movement.repository';
import { TypeStockMovementReason } from '@/shared/infra/enums/stock-movement';
import { TypeCashRegisterMovement } from '@/shared/infra/enums/cash-register';
import { TypePaymentMethod } from '@/shared/infra/enums/sale';
import { TypeDailyProductionItemStatus } from '@/shared/infra/enums/daily-production';
import { CashRegisterSessionRepository } from '../../domain/repositories/cash-register-session.repository';
import { CashRegisterMovementRepository } from '../../domain/repositories/cash-register-movement.repository';
import {
  buildCashRegisterSessionDetail,
  round2,
} from '../helpers/build-cash-register-session-detail';
import { toCashRegisterMovementOutput } from '../helpers/to-cash-register-movement-output';

type Input = {
  id: string;
};

type Output = FindCashRegisterSessionDetailOutput;

// Dia (meia-noite em Brasília) em que o instante cai — não o dia do fuso do
// servidor, que em produção é UTC.
const toDateOnly = (date: Date): Date => startOfBusinessDay(date);

export class FindCashRegisterSessionDetailUseCase
  implements UseCase<Input, Output>
{
  constructor(
    @Inject(PROVIDERS.CASH_REGISTER_SESSION_REPOSITORY)
    private readonly cashRegisterSessionRepository: CashRegisterSessionRepository,
    @Inject(PROVIDERS.SALE_REPOSITORY)
    private readonly saleRepository: SaleRepository,
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
      salesCash,
      salesPix,
      salesCard,
      movements,
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
      this.saleRepository.sumTotalByCashRegisterSessionAndPaymentMethod(
        session.id,
        TypePaymentMethod.CASH,
      ),
      this.saleRepository.sumTotalByCashRegisterSessionAndPaymentMethod(
        session.id,
        TypePaymentMethod.PIX,
      ),
      this.saleRepository.sumTotalByCashRegisterSessionAndPaymentMethod(
        session.id,
        TypePaymentMethod.CARD,
      ),
      this.cashRegisterMovementRepository.findAllByCashRegisterSessionId(
        session.id,
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

    const detail = buildCashRegisterSessionDetail({
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

    return {
      ...detail,
      salesCash: round2(salesCash),
      salesPix: round2(salesPix),
      salesCard: round2(salesCard),
      movements: movements.map(toCashRegisterMovementOutput),
    };
  }
}
