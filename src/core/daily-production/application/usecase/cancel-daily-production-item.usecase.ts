import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { CancelDailyProductionItemOutput } from '@/shared/application/output/daily-production/cancel-daily-production-item.output';
import {
  TypeDailyProductionItemStatus,
  TypeDailyProductionStatus,
} from '@/shared/infra/enums/daily-production';
import { DailyProductionRepository } from '../../domain/repositories/daily-production.repository';
import { DailyProductionItemRepository } from '../../domain/repositories/daily-production-item.repository';

type Input = {
  id: string;
};

type Output = CancelDailyProductionItemOutput;

export class CancelDailyProductionItemUseCase
  implements UseCase<Input, Output>
{
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

    const item = await this.dailyProductionItemRepository.findByIdWithDailyProduction(
      input.id,
    );

    if (!item || item.dailyProduction?.company?.id !== loggedUser.company.id) {
      throw new NotFoundError('Item de produção não encontrado');
    }

    if (item.status !== TypeDailyProductionItemStatus.PLANNED) {
      throw new BadRequestError(
        'Apenas itens aguardando produção podem ser cancelados',
      );
    }

    if (item.dailyProduction!.status !== TypeDailyProductionStatus.OPEN) {
      throw new BadRequestError('Produção diária já está concluída');
    }

    item.cancel(loggedUser.id);

    await this.dailyProductionItemRepository.update(item);

    await this.completeDailyProductionIfNeeded(
      item.dailyProduction!.id,
      loggedUser.id,
    );

    return { id: item.id };
  }

  private async completeDailyProductionIfNeeded(
    dailyProductionId: string,
    updatedBy: string,
  ): Promise<void> {
    const items = await this.dailyProductionItemRepository.findAllByDailyProductionId(
      dailyProductionId,
    );

    const hasPlannedItems = items.some(
      (item) => item.status === TypeDailyProductionItemStatus.PLANNED,
    );
    const hasProducedItems = items.some(
      (item) => item.status === TypeDailyProductionItemStatus.PRODUCED,
    );

    if (hasPlannedItems || !hasProducedItems) {
      return;
    }

    const dailyProduction =
      await this.dailyProductionRepository.findById(dailyProductionId);

    if (!dailyProduction) return;

    dailyProduction.complete(updatedBy);

    await this.dailyProductionRepository.update(dailyProduction);
  }
}
