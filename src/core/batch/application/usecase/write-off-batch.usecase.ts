import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { WriteOffBatchOutput } from '@/shared/application/output/batch/write-off-batch.output';
import { TypeOperationStock } from '@/shared/infra/enums/product';
import { TypeBatchMovement, TypeBatchMovementReason } from '@/shared/infra/enums/batch';
import { Transactional } from 'typeorm-transactional';
import { ProductRepository } from '@/core/product/domain/repositories/product.repository';
import { UpdateStockProductUseCase } from '@/core/product/application/usecase/increase-decrease-stock-product.usecase';
import { BatchRepository } from '../../domain/repositories/batch.repository';
import { BatchMovementRepository } from '../../domain/repositories/batch-movement.repository';
import { BatchMovement } from '../../domain/entities/batch-movement.entity';
import { FefoAllocatorService } from '../services/fefo-allocator.service';

type Input = {
  productId: string;
  quantity: number;
  reason: TypeBatchMovementReason;
  reasonDescription?: string | null;
};

type Output = WriteOffBatchOutput;

export class WriteOffBatchUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.BATCH_REPOSITORY)
    private readonly batchRepository: BatchRepository,
    @Inject(PROVIDERS.BATCH_MOVEMENT_REPOSITORY)
    private readonly batchMovementRepository: BatchMovementRepository,
    @Inject(PROVIDERS.PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
    private readonly updateStockProductUseCase: UpdateStockProductUseCase,
  ) {}

  @Transactional()
  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const company = loggedUser.company;

    const product = await this.productRepository.findProductByIdAndCompanyId(
      input.productId,
      company.id,
    );

    if (!product) {
      throw new NotFoundError('Produto não encontrado');
    }

    const availableBatches =
      await this.batchRepository.findAvailableByProductIdOrderByExpiration(
        input.productId,
        company.id,
      );

    const allocations = FefoAllocatorService.allocate(
      availableBatches.map((batch) => ({
        id: batch.id,
        remainingQuantity: batch.remainingQuantity,
      })),
      input.quantity,
    );

    const batchesById = new Map(
      availableBatches.map((batch) => [batch.id, batch]),
    );

    for (const allocation of allocations) {
      const batch = batchesById.get(allocation.batchId)!;

      batch.consume(allocation.quantityToTake, loggedUser.id);

      await this.batchRepository.update(batch);

      await this.batchMovementRepository.save(
        BatchMovement.create({
          batchId: batch.id,
          type: TypeBatchMovement.EXIT,
          quantity: allocation.quantityToTake,
          reason: input.reason,
          reasonDescription: input.reasonDescription ?? null,
          createdBy: loggedUser.id,
        }),
      );
    }

    await this.updateStockProductUseCase.execute({
      productId: product.id,
      type: TypeOperationStock.DECREASE,
      value: input.quantity,
    });

    return {
      productId: product.id,
      totalWrittenOff: input.quantity,
      batchesAffected: allocations.length,
    };
  }
}
