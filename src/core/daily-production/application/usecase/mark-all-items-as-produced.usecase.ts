import { HttpException, Inject, Logger } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import {
  MarkAllItemsAsProducedFailure,
  MarkAllItemsAsProducedOutput,
} from '@/shared/application/output/daily-production/mark-all-items-as-produced.output';
import {
  TypeDailyProductionItemStatus,
  TypeDailyProductionStatus,
} from '@/shared/infra/enums/daily-production';
import { DailyProductionRepository } from '../../domain/repositories/daily-production.repository';
import { DailyProductionItemRepository } from '../../domain/repositories/daily-production-item.repository';
import { MarkDailyProductionItemAsProducedUseCase } from './mark-item-as-produced.usecase';

type Input = {
  dailyProductionId: string;
};

type Output = MarkAllItemsAsProducedOutput;

const UNEXPECTED_FAILURE_REASON =
  'Erro inesperado ao concluir o item. Tente concluí-lo individualmente.';

/**
 * Versão em lote do `MarkDailyProductionItemAsProducedUseCase` (botão
 * "Concluir tudo"): marca como produzidos todos os itens PLANNED da produção
 * diária, usando a quantidade/peso planejado de cada um. Itens já produzidos
 * ou cancelados ficam como estão.
 *
 * Sucesso parcial de propósito: NÃO é @Transactional — cada item roda na
 * própria transação do usecase individual. Se um item falhar (ex.: estoque
 * insuficiente de um insumo), só ele é revertido e continua PLANNED; os
 * demais são concluídos normalmente e a falha volta em `failures` com o
 * motivo, pra tela mostrar o que ficou pendente.
 */
export class MarkAllDailyProductionItemsAsProducedUseCase
  implements UseCase<Input, Output>
{
  private readonly logger = new Logger(
    MarkAllDailyProductionItemsAsProducedUseCase.name,
  );

  constructor(
    @Inject(PROVIDERS.DAILY_PRODUCTION_REPOSITORY)
    private readonly dailyProductionRepository: DailyProductionRepository,
    @Inject(PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY)
    private readonly dailyProductionItemRepository: DailyProductionItemRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
    private readonly markDailyProductionItemAsProducedUseCase: MarkDailyProductionItemAsProducedUseCase,
  ) {}

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
    // sobra item PLANNED) — cada chamada abre e fecha a própria transação.
    const itemIds: string[] = [];
    const failures: MarkAllItemsAsProducedFailure[] = [];

    for (const item of plannedItems) {
      try {
        const { id } =
          await this.markDailyProductionItemAsProducedUseCase.execute({
            id: item.id,
          });
        itemIds.push(id);
      } catch (error) {
        failures.push({
          itemId: item.id,
          productName: item.product?.name ?? 'Produto',
          reason: this.toFailureReason(error),
        });
      }
    }

    return { itemIds, failures };
  }

  // Erros de domínio (HttpException: estoque insuficiente, item já
  // produzido, etc.) já têm mensagem pronta pro usuário. Qualquer outra
  // coisa é inesperada — loga e devolve uma mensagem genérica, sem vazar
  // detalhes internos.
  private toFailureReason(error: unknown): string {
    if (error instanceof HttpException) {
      return error.message;
    }

    this.logger.error(
      'Falha inesperada ao concluir item no "Concluir tudo"',
      error instanceof Error ? error.stack : String(error),
    );

    return UNEXPECTED_FAILURE_REASON;
  }
}
