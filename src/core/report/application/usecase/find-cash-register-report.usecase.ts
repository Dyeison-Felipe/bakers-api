import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { CashRegisterSessionRepository } from '@/core/cash-register/domain/repositories/cash-register-session.repository';
import { FindCashRegisterSessionDetailUseCase } from '@/core/cash-register/application/usecase/find-cash-register-session-detail.usecase';
import { CashRegisterReportOutput } from '@/shared/application/output/report/cash-register-report.output';

type Input = {
  dateFrom: Date;
  dateTo: Date;
};

type Output = CashRegisterReportOutput;

const round2 = (value: number) => Math.round(value * 100) / 100;

export class FindCashRegisterReportUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.CASH_REGISTER_SESSION_REPOSITORY)
    private readonly cashRegisterSessionRepository: CashRegisterSessionRepository,
    private readonly findCashRegisterSessionDetailUseCase: FindCashRegisterSessionDetailUseCase,
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

    const sessionDetails = await Promise.all(
      sessions.map((session) =>
        this.findCashRegisterSessionDetailUseCase.execute({ id: session.id }),
      ),
    );

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
