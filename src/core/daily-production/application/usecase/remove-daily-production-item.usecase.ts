import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { RemoveDailyProductionItemOutput } from '@/shared/application/output/daily-production/remove-daily-production-item.output';
import { TypeDailyProductionItemStatus, TypeDailyProductionStatus } from '@/shared/infra/enums/daily-production';
import { DailyProductionItemRepository } from '../../domain/repositories/daily-production-item.repository';

type Input = {
  id: string;
};

type Output = RemoveDailyProductionItemOutput;

export class RemoveDailyProductionItemUseCase implements UseCase<Input, Output> {
  constructor(
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
        'Item já produzido não pode ser removido da produção',
      );
    }

    if (item.dailyProduction!.status !== TypeDailyProductionStatus.OPEN) {
      throw new BadRequestError('Produção diária já está concluída');
    }

    await this.dailyProductionItemRepository.delete(item.id);

    return { id: item.id };
  }
}
