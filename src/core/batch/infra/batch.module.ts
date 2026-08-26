import { Module } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { ProductPersistenceModule } from '@/core/product/infra/product-persistence.module';
import { ProductRepository } from '@/core/product/domain/repositories/product.repository';
import { UpdateStockProductUseCase } from '@/core/product/application/usecase/increase-decrease-stock-product.usecase';
import { BatchPersistenceModule } from './batch-persistence.module';
import { BatchRepository } from '../domain/repositories/batch.repository';
import { BatchMovementRepository } from '../domain/repositories/batch-movement.repository';
import { BatchController } from './controllers/batch.controller';
import { CreateBatchUseCase } from '../application/usecase/create-batch.usecase';
import { UpdateBatchUseCase } from '../application/usecase/update-batch.usecase';
import { DeleteBatchUseCase } from '../application/usecase/delete-batch.usecase';
import { WriteOffBatchUseCase } from '../application/usecase/write-off-batch.usecase';
import { FindAllBatchesUseCase } from '../application/usecase/find-all-batches.usecase';
import { FindBatchByIdUseCase } from '../application/usecase/find-batch-by-id.usecase';
import { FindTodayLeftoverBatchesUseCase } from '../application/usecase/find-today-leftover-batches.usecase';
import { DiscardBatchLeftoverUseCase } from '../application/usecase/discard-batch-leftover.usecase';
import { FindWasteMovementsUseCase } from '../application/usecase/find-waste-movements.usecase';

@Module({
  imports: [BatchPersistenceModule, ProductPersistenceModule],
  controllers: [BatchController],
  providers: [
    {
      provide: UpdateStockProductUseCase,
      useFactory: (
        productRepository: ProductRepository,
        loggedUserService: LoggedUserService,
      ) => new UpdateStockProductUseCase(productRepository, loggedUserService),
      inject: [PROVIDERS.PRODUCT_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
    {
      provide: CreateBatchUseCase,
      useFactory: (
        batchRepository: BatchRepository,
        batchMovementRepository: BatchMovementRepository,
        productRepository: ProductRepository,
        loggedUserService: LoggedUserService,
        updateStockProductUseCase: UpdateStockProductUseCase,
      ) =>
        new CreateBatchUseCase(
          batchRepository,
          batchMovementRepository,
          productRepository,
          loggedUserService,
          updateStockProductUseCase,
        ),
      inject: [
        PROVIDERS.BATCH_REPOSITORY,
        PROVIDERS.BATCH_MOVEMENT_REPOSITORY,
        PROVIDERS.PRODUCT_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
        UpdateStockProductUseCase,
      ],
    },
    {
      provide: UpdateBatchUseCase,
      useFactory: (
        batchRepository: BatchRepository,
        batchMovementRepository: BatchMovementRepository,
        loggedUserService: LoggedUserService,
        updateStockProductUseCase: UpdateStockProductUseCase,
      ) =>
        new UpdateBatchUseCase(
          batchRepository,
          batchMovementRepository,
          loggedUserService,
          updateStockProductUseCase,
        ),
      inject: [
        PROVIDERS.BATCH_REPOSITORY,
        PROVIDERS.BATCH_MOVEMENT_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
        UpdateStockProductUseCase,
      ],
    },
    {
      provide: DeleteBatchUseCase,
      useFactory: (
        batchRepository: BatchRepository,
        batchMovementRepository: BatchMovementRepository,
        loggedUserService: LoggedUserService,
        updateStockProductUseCase: UpdateStockProductUseCase,
      ) =>
        new DeleteBatchUseCase(
          batchRepository,
          batchMovementRepository,
          loggedUserService,
          updateStockProductUseCase,
        ),
      inject: [
        PROVIDERS.BATCH_REPOSITORY,
        PROVIDERS.BATCH_MOVEMENT_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
        UpdateStockProductUseCase,
      ],
    },
    {
      provide: WriteOffBatchUseCase,
      useFactory: (
        batchRepository: BatchRepository,
        batchMovementRepository: BatchMovementRepository,
        productRepository: ProductRepository,
        loggedUserService: LoggedUserService,
        updateStockProductUseCase: UpdateStockProductUseCase,
      ) =>
        new WriteOffBatchUseCase(
          batchRepository,
          batchMovementRepository,
          productRepository,
          loggedUserService,
          updateStockProductUseCase,
        ),
      inject: [
        PROVIDERS.BATCH_REPOSITORY,
        PROVIDERS.BATCH_MOVEMENT_REPOSITORY,
        PROVIDERS.PRODUCT_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
        UpdateStockProductUseCase,
      ],
    },
    {
      provide: FindAllBatchesUseCase,
      useFactory: (
        batchRepository: BatchRepository,
        loggedUserService: LoggedUserService,
      ) => new FindAllBatchesUseCase(batchRepository, loggedUserService),
      inject: [PROVIDERS.BATCH_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
    {
      provide: FindBatchByIdUseCase,
      useFactory: (
        batchRepository: BatchRepository,
        loggedUserService: LoggedUserService,
      ) => new FindBatchByIdUseCase(batchRepository, loggedUserService),
      inject: [PROVIDERS.BATCH_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
    {
      provide: FindTodayLeftoverBatchesUseCase,
      useFactory: (
        batchRepository: BatchRepository,
        loggedUserService: LoggedUserService,
      ) =>
        new FindTodayLeftoverBatchesUseCase(batchRepository, loggedUserService),
      inject: [PROVIDERS.BATCH_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
    {
      provide: DiscardBatchLeftoverUseCase,
      useFactory: (
        batchRepository: BatchRepository,
        batchMovementRepository: BatchMovementRepository,
        loggedUserService: LoggedUserService,
        updateStockProductUseCase: UpdateStockProductUseCase,
      ) =>
        new DiscardBatchLeftoverUseCase(
          batchRepository,
          batchMovementRepository,
          loggedUserService,
          updateStockProductUseCase,
        ),
      inject: [
        PROVIDERS.BATCH_REPOSITORY,
        PROVIDERS.BATCH_MOVEMENT_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
        UpdateStockProductUseCase,
      ],
    },
    {
      provide: FindWasteMovementsUseCase,
      useFactory: (
        batchMovementRepository: BatchMovementRepository,
        loggedUserService: LoggedUserService,
      ) =>
        new FindWasteMovementsUseCase(batchMovementRepository, loggedUserService),
      inject: [PROVIDERS.BATCH_MOVEMENT_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
  ],
  exports: [CreateBatchUseCase, WriteOffBatchUseCase],
})
export class BatchModule {}
