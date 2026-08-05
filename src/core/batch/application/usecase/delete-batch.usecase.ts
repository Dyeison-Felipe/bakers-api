import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { DeleteBatchOutput } from '@/shared/application/output/batch/delete-batch.output';
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
};

type Output = DeleteBatchOutput;

export class DeleteBatchUseCase implements UseCase<Input, Output> {
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

    if (batch.remainingQuantity > 0) {
      await this.batchMovementRepository.save(
        BatchMovement.create({
          batchId: batch.id,
          type: TypeBatchMovement.EXIT,
          quantity: batch.remainingQuantity,
          reason: TypeBatchMovementReason.DELETION,
          reasonDescription: null,
          unitCostSnapshot: null,
          createdBy: loggedUser.id,
        }),
      );

      await this.updateStockProductUseCase.execute({
        productId: batch.product!.id,
        type: TypeOperationStock.DECREASE,
        value: batch.remainingQuantity,
      });
    }

    await this.batchRepository.delete(batch.id);

    return { id: batch.id };
  }
}
