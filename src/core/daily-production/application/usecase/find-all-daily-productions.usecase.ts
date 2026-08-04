import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { PaginationOutput } from '@/shared/application/output/pagination/pagination.output';
import { FindAllDailyProductionsOutput } from '@/shared/application/output/daily-production/find-all-daily-productions.output';
import { TypeDailyProductionStatus } from '@/shared/infra/enums/daily-production';
import { DailyProductionRepository } from '../../domain/repositories/daily-production.repository';
import { DailyProductionItemRepository } from '../../domain/repositories/daily-production-item.repository';

type Input = {
  status?: TypeDailyProductionStatus;
  productionDate?: Date;
  page?: number;
  limit?: number;
};

type Output = PaginationOutput<FindAllDailyProductionsOutput>;

export class FindAllDailyProductionsUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.DAILY_PRODUCTION_REPOSITORY)
    private readonly dailyProductionRepository: DailyProductionRepository,
    @Inject(PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY)
    private readonly dailyProductionItemRepository: DailyProductionItemRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const dailyProductions = await this.dailyProductionRepository.findAllByCompanyId(
      loggedUser.company.id,
      {
        status: input.status,
        productionDate: input.productionDate,
      },
      {
        page: input.page,
        limit: input.limit,
      },
    );

    const items = await Promise.all(
      dailyProductions.items.map(async (dailyProduction) => {
        const productionItems =
          await this.dailyProductionItemRepository.findAllByDailyProductionId(
            dailyProduction.id,
          );

        return {
          id: dailyProduction.id,
          productionDate: dailyProduction.productionDate,
          status: dailyProduction.status,
          totalPlannedCost: productionItems.reduce(
            (sum, item) => sum + item.plannedCost,
            0,
          ),
          itemCount: productionItems.length,
        };
      }),
    );

    return {
      items,
      meta: dailyProductions.meta,
    };
  }
}
