import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { MarkAllItemsAsProducedOutput } from '@/shared/application/output/daily-production/mark-all-items-as-produced.output';
import {
  TypeDailyProductionItemStatus,
  TypeDailyProductionStatus,
} from '@/shared/infra/enums/daily-production';
import { Transactional } from 'typeorm-transactional';
import { DailyProductionRepository } from '../../domain/repositories/daily-production.repository';
import { DailyProductionItemRepository } from '../../domain/repositories/daily-production-item.repository';
import { MarkDailyProductionItemAsProducedUseCase } from './mark-item-as-produced.usecase';

type Input = {
  dailyProductionId: string;
};

type Output = MarkAllItemsAsProducedOutput;

/**
 * Versão em lote do `MarkDailyProductionItemAsProducedUseCase` (botão
 * "Concluir tudo"): marca como produzidos todos os itens PLANNED da produção
 * diária, usando a quantidade/peso planejado de cada um. Itens já produzidos
 * ou cancelados ficam como estão. Roda numa única transação — se a baixa de
 * estoque de um item falhar, nenhum item é concluído.
 */
export class MarkAllDailyProductionItemsAsProducedUseCase
  implements UseCase<Input, Output>
{
  constructor(
    @Inject(PROVIDERS.DAILY_PRODUCTION_REPOSITORY)
    private readonly dailyProductionRepository: DailyProductionRepository,
    @Inject(PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY)
    private readonly dailyProductionItemRepository: DailyProductionItemRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
    private readonly markDailyProductionItemAsProducedUseCase: MarkDailyProductionItemAsProducedUseCase,
  ) {}

  @Transactional()
  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const dailyProduction =
      await this.dailyProductionRepository.findByIdAndCompanyId(
        input.dailyProductionId,
        loggedUser.company.id,
      );

    if (!dailyProduction) {
      throw new NotFoundError('Produção diária não encontrada');
    }

    if (dailyProduction.status !== TypeDailyProductionStatus.OPEN) {
      throw new BadRequestError('Produção diária já está concluída');
    }

    const items =
      await this.dailyProductionItemRepository.findAllByDailyProductionId(
        dailyProduction.id,
      );

    const plannedItems = items.filter(
      (item) => item.status === TypeDailyProductionItemStatus.PLANNED,
    );

    if (!plannedItems.length) {
      throw new BadRequestError('Nenhum item aguardando produção');
    }

    // Reaproveita o fluxo individual (baixa dos insumos da receita, entrada
    // no estoque do produto e conclusão automática da produção quando não
    // sobra item PLANNED) — o @Transactional dele entra nesta transação.
    const itemIds: string[] = [];

    for (const item of plannedItems) {
      const { id } = await this.markDailyProductionItemAsProducedUseCase.execute({
        id: item.id,
      });
      itemIds.push(id);
    }

    return { itemIds };
  }
}
