import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { UpdateBatchOutput } from '@/shared/application/output/batch/update-batch.output';
import { TypeOperationStock } from '@/shared/infra/enums/product';
import {
  TypeBatchMovement,
  TypeBatchMovementReason,
} from '@/shared/infra/enums/batch';
import { Transactional } from 'typeorm-transactional';
import { UpdateStockProductUseCase } from '@/core/product/application/usecase/increase-decrease-stock-product.usecase';
import { BatchRepository } from '../../domain/repositories/batch.repository';
import { BatchMovementRepository } from '../../domain/repositories/batch-movement.repository';
import { BatchMovement } from '../../domain/entities/batch-movement.entity';

type Input = {
  id: string;
  quantity?: number;
  expirationDate?: Date | null;
};

type Output = UpdateBatchOutput;

export class UpdateBatchUseCase implements UseCase<Input, Output> {
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

    const batch = await this.batchRepository.findByIdAndCompanyId(
      input.id,
      loggedUser.company.id,
    );

    if (!batch) {
      throw new NotFoundError('Lote não encontrado');
    }

    const newQuantity = input.quantity ?? batch.quantity;
    const consumedQuantity = batch.quantity - batch.remainingQuantity;

    if (newQuantity < consumedQuantity) {
      throw new BadRequestError(
        `A quantidade do lote não pode ser menor que a quantidade já consumida (${consumedQuantity})`,
      );
    }

    const delta = newQuantity - batch.quantity;
    const newRemainingQuantity = batch.remainingQuantity + delta;
    const newExpirationDate =
      input.expirationDate !== undefined
        ? input.expirationDate
        : batch.expirationDate;

    batch.applyCorrection(
      newQuantity,
      newRemainingQuantity,
      newExpirationDate,
      loggedUser.id,
    );

    await this.batchRepository.update(batch);

    if (delta !== 0) {
      await this.batchMovementRepository.save(
        BatchMovement.create({
          batchId: batch.id,
          type: delta > 0 ? TypeBatchMovement.ENTRY : TypeBatchMovement.EXIT,
          quantity: Math.abs(delta),
          reason: TypeBatchMovementReason.CORRECTION,
          reasonDescription: null,
          unitCostSnapshot: null,
          createdBy: loggedUser.id,
        }),
      );

      await this.updateStockProductUseCase.execute({
        productId: batch.product!.id,
        type:
          delta > 0 ? TypeOperationStock.INCREASE : TypeOperationStock.DECREASE,
        value: Math.abs(delta),
      });
    }

    return { id: batch.id };
  }
}
