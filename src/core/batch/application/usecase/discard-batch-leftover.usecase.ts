import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { DiscardBatchLeftoverOutput } from '@/shared/application/output/batch/discard-batch-leftover.output';
import { TypeOperationStock, TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { TypeBatchMovement, TypeBatchMovementReason } from '@/shared/infra/enums/batch';
import { Transactional } from 'typeorm-transactional';
import { UpdateStockProductUseCase } from '@/core/product/application/usecase/increase-decrease-stock-product.usecase';
import { BatchRepository } from '../../domain/repositories/batch.repository';
import { BatchMovementRepository } from '../../domain/repositories/batch-movement.repository';
import { BatchMovement } from '../../domain/entities/batch-movement.entity';

type Input = {
  batchId: string;
  quantity?: number;
  reasonDescription?: string;
  soldAtCost?: boolean;
};

type Output = DiscardBatchLeftoverOutput;

const round2 = (value: number) => Math.round(value * 100) / 100;

export class DiscardBatchLeftoverUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.BATCH_REPOSITORY)
    private readonly batchRepository: BatchRepository,
    @Inject(PROVIDERS.BATCH_MOVEMENT_REPOSITORY)
    private readonly batchMovementRepository: BatchMovementRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
    private readonly updateStockProductUseCase: UpdateStockProductUseCase,
  ) {}

  @Transactional()
  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const companyId = loggedUser.company.id;

    const batch = await this.batchRepository.findByIdAndCompanyId(
      input.batchId,
      companyId,
    );

    if (!batch) {
      throw new NotFoundError('Lote não encontrado');
    }

    const quantity = input.quantity ?? batch.remainingQuantity;

    if (!quantity || quantity <= 0) {
      throw new BadRequestError('Informe uma quantidade válida para descarte');
    }

    if (quantity > batch.remainingQuantity) {
      throw new BadRequestError(
        'Quantidade a descartar maior que a quantidade restante do lote',
      );
    }

    const isWeightBased = batch.unitOfMeasurement === TypeUnitOfMeasurement.KG;
    const costBasis = isWeightBased
      ? (batch.product!.pricePerKilogram ?? 0)
      : batch.product!.unitCostPrice;

    const soldAtCost = input.soldAtCost ?? false;

    batch.consume(quantity, loggedUser.id);
    await this.batchRepository.update(batch);

    await this.batchMovementRepository.save(
      BatchMovement.create({
        batchId: batch.id,
        type: TypeBatchMovement.EXIT,
        quantity,
        reason: soldAtCost
          ? TypeBatchMovementReason.LEFTOVER_SOLD_AT_COST
          : TypeBatchMovementReason.WASTE,
        reasonDescription: input.reasonDescription ?? null,
        unitCostSnapshot: costBasis,
        createdBy: loggedUser.id,
      }),
    );

    await this.updateStockProductUseCase.execute({
      productId: batch.product!.id,
      type: TypeOperationStock.DECREASE,
      value: quantity,
    });

    const value = round2(quantity * costBasis);

    return {
      id: batch.id,
      discardedQuantity: quantity,
      soldAtCost,
      lossValue: soldAtCost ? null : value,
      recoveredValue: soldAtCost ? value : null,
    };
  }
}
