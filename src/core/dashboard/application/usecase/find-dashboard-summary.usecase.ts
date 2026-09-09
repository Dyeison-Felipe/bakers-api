import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { DashboardSummaryOutput } from '@/shared/application/output/dashboard/dashboard-summary.output';
import { SaleRepository } from '@/core/sale/domain/repositories/sale.repository';
import { DailyProductionRepository } from '@/core/daily-production/domain/repositories/daily-production.repository';
import { DailyProductionItemRepository } from '@/core/daily-production/domain/repositories/daily-production-item.repository';
import { ExpenseRepository } from '@/core/expense/domain/repositories/expense.repository';
import { TypePaymentMethod } from '@/shared/infra/enums/sale';
import { isPermissionInPlan } from '@/shared/application/helpers/plan-permission.helper';
import { PermissionSale } from '@/core/auth/domain/permissions-definition/sale';

type Input = void;
type Output = DashboardSummaryOutput;

const round2 = (value: number) => Math.round(value * 100) / 100;

export class FindDashboardSummaryUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.SALE_REPOSITORY)
    private readonly saleRepository: SaleRepository,
    @Inject(PROVIDERS.DAILY_PRODUCTION_REPOSITORY)
    private readonly dailyProductionRepository: DailyProductionRepository,
    @Inject(PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY)
    private readonly dailyProductionItemRepository: DailyProductionItemRepository,
    @Inject(PROVIDERS.EXPENSE_REPOSITORY)
    private readonly expenseRepository: ExpenseRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const companyId = loggedUser.company.id;

    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    // Empresa sem PDV/Caixa no plano não tem dado de venda pra mostrar —
    // omite em vez de 403 (Dashboard nunca deve exibir erro de permissão).
    const canReadSales = isPermissionInPlan(
      loggedUser.company.plan?.permissions,
      PermissionSale.SALE_READER,
    );

    const [
      salesRevenueCashToday,
      salesRevenuePixToday,
      salesRevenueCardToday,
      dailyProductions,
      expenses,
    ] = await Promise.all([
      canReadSales
        ? this.saleRepository.sumTotalByCompanyAndDateRangeAndPaymentMethod(
            companyId,
            startOfDay,
            endOfDay,
            TypePaymentMethod.CASH,
          )
        : Promise.resolve(0),
      canReadSales
        ? this.saleRepository.sumTotalByCompanyAndDateRangeAndPaymentMethod(
            companyId,
            startOfDay,
            endOfDay,
            TypePaymentMethod.PIX,
          )
        : Promise.resolve(0),
      canReadSales
        ? this.saleRepository.sumTotalByCompanyAndDateRangeAndPaymentMethod(
            companyId,
            startOfDay,
            endOfDay,
            TypePaymentMethod.CARD,
          )
        : Promise.resolve(0),
      this.dailyProductionRepository.findAllByCompanyId(companyId, {
        productionDate: startOfDay,
      }),
      this.expenseRepository.findAllByCompanyAndDate(companyId, startOfDay),
    ]);

    const productionItemsByProduction = await Promise.all(
      dailyProductions.items.map((production) =>
        this.dailyProductionItemRepository.findAllByDailyProductionId(
          production.id,
        ),
      ),
    );

    const productionCostToday = round2(
      productionItemsByProduction
        .flat()
        .reduce((sum, item) => sum + item.plannedCost, 0),
    );

    const expensesToday = round2(
      expenses.reduce((sum, expense) => sum + expense.value, 0),
    );

    return {
      productionCostToday,
      expensesToday,
      ...(canReadSales
        ? {
            salesRevenueCashToday: round2(salesRevenueCashToday),
            salesRevenuePixToday: round2(salesRevenuePixToday),
            salesRevenueCardToday: round2(salesRevenueCardToday),
          }
        : {}),
    };
  }
}
