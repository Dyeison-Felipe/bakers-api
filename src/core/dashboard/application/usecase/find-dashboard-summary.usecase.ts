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
import { isPermissionGranted } from '@/shared/application/helpers/user-permission.helper';
import { PermissionSale } from '@/core/auth/domain/permissions-definition/sale';
import { PermissionDailyProduction } from '@/core/auth/domain/permissions-definition/daily-production';
import { PermissionExpense } from '@/core/auth/domain/permissions-definition/expense';
import { getBusinessTodayRange } from '@/shared/infra/utils/get-business-today-range';
import { TypeDailyProductionItemStatus } from '@/shared/infra/enums/daily-production';

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

    const { startOfDay, endOfDay } = getBusinessTodayRange();

    // Dashboard nunca deve devolver 403 — cada seção é omitida (não zerada,
    // pra não confundir "sem dado hoje" com "sem acesso") quando o usuário
    // logado não tem a permissão da tela de origem daquele dado, considerando
    // tanto o plano da empresa quanto a permissão individual dele.
    const canReadSales = isPermissionGranted(
      loggedUser,
      PermissionSale.SALE_READER,
    );
    const canReadProduction = isPermissionGranted(
      loggedUser,
      PermissionDailyProduction.DAILY_PRODUCTION_READER,
    );
    const canReadExpenses = isPermissionGranted(
      loggedUser,
      PermissionExpense.EXPENSE_READER,
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
      canReadProduction
        ? this.dailyProductionRepository.findAllByCompanyId(companyId, {
            productionDate: startOfDay,
          })
        : Promise.resolve(null),
      canReadExpenses
        ? this.expenseRepository.findAllByCompanyAndDate(companyId, startOfDay)
        : Promise.resolve(null),
    ]);

    let productionCostToday: number | undefined;

    if (canReadProduction && dailyProductions) {
      const productionItemsByProduction = await Promise.all(
        dailyProductions.items.map((production) =>
          this.dailyProductionItemRepository.findAllByDailyProductionId(
            production.id,
          ),
        ),
      );

      productionCostToday = round2(
        productionItemsByProduction
          .flat()
          .filter((item) => item.status === TypeDailyProductionItemStatus.PRODUCED)
          .reduce((sum, item) => sum + item.plannedCost, 0),
      );
    }

    const expensesToday =
      canReadExpenses && expenses
        ? round2(expenses.reduce((sum, expense) => sum + expense.value, 0))
        : undefined;

    return {
      ...(canReadProduction ? { productionCostToday } : {}),
      ...(canReadExpenses ? { expensesToday } : {}),
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
