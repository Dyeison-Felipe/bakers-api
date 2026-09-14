import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { MarkItemAsProducedOutput } from '@/shared/application/output/daily-production/mark-item-as-produced.output';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import {
  TypeDailyProductionItemStatus,
} from '@/shared/infra/enums/daily-production';
import { Transactional } from 'typeorm-transactional';
import { AdjustProductStockUseCase } from '@/core/stock-movement/application/usecase/adjust-product-stock.usecase';
import {
  TypeStockMovement,
  TypeStockMovementReason,
} from '@/shared/infra/enums/stock-movement';
import { DailyProductionRepository } from '../../domain/repositories/daily-production.repository';
import { DailyProductionItemRepository } from '../../domain/repositories/daily-production-item.repository';

type Input = {
  id: string;
  actualWeight?: number;
};

type Output = MarkItemAsProducedOutput;

export class MarkDailyProductionItemAsProducedUseCase
  implements UseCase<Input, Output>
{
  constructor(
    @Inject(PROVIDERS.DAILY_PRODUCTION_REPOSITORY)
    private readonly dailyProductionRepository: DailyProductionRepository,
    @Inject(PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY)
    private readonly dailyProductionItemRepository: DailyProductionItemRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
    private readonly adjustProductStockUseCase: AdjustProductStockUseCase,
  ) {}

  @Transactional()
  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const item = await this.dailyProductionItemRepository.findByIdWithDailyProduction(
      input.id,
    );

    if (!item || item.dailyProduction?.company?.id !== loggedUser.company.id) {
      throw new NotFoundError('Item de produção não encontrado');
    }

    if (item.status !== TypeDailyProductionItemStatus.PLANNED) {
      throw new BadRequestError('Item já foi produzido');
    }

    let actualQuantity: number | null = null;
    let actualWeight: number | null = null;
    let quantityProduced: number;

    if (item.unitOfMeasurement === TypeUnitOfMeasurement.KG) {
      if (!input.actualWeight || input.actualWeight <= 0) {
        throw new BadRequestError('Informe o peso real produzido');
      }

      actualWeight = input.actualWeight;
      quantityProduced = input.actualWeight;
    } else {
      actualQuantity = item.plannedQuantity!;
      quantityProduced = item.plannedQuantity!;
    }

    await this.adjustProductStockUseCase.execute({
      productId: item.product!.id,
      quantity: quantityProduced,
      type: TypeStockMovement.ENTRY,
      reason: TypeStockMovementReason.PRODUCTION,
    });

    item.markAsProduced({
      actualQuantity,
      actualWeight,
      producedBy: loggedUser.id,
    });

    await this.dailyProductionItemRepository.update(item);

    await this.completeDailyProductionIfNeeded(item.dailyProduction!.id, loggedUser.id);

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
