import { Module } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { ProductPersistenceModule } from '@/core/product/infra/product-persistence.module';
import { ProductRepository } from '@/core/product/domain/repositories/product.repository';
import { UpdateStockProductUseCase } from '@/core/product/application/usecase/increase-decrease-stock-product.usecase';
import { StockMovementPersistenceModule } from './stock-movement-persistence.module';
import { StockMovementRepository } from '../domain/repositories/stock-movement.repository';
import { StockMovementController } from './controllers/stock-movement.controller';
import { AdjustProductStockUseCase } from '../application/usecase/adjust-product-stock.usecase';
import { FindWasteMovementsUseCase } from '../application/usecase/find-waste-movements.usecase';

@Module({
  imports: [StockMovementPersistenceModule, ProductPersistenceModule],
  controllers: [StockMovementController],
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
      provide: AdjustProductStockUseCase,
      useFactory: (
        stockMovementRepository: StockMovementRepository,
        productRepository: ProductRepository,
        loggedUserService: LoggedUserService,
        updateStockProductUseCase: UpdateStockProductUseCase,
      ) =>
        new AdjustProductStockUseCase(
          stockMovementRepository,
          productRepository,
          loggedUserService,
          updateStockProductUseCase,
        ),
      inject: [
        PROVIDERS.STOCK_MOVEMENT_REPOSITORY,
        PROVIDERS.PRODUCT_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
        UpdateStockProductUseCase,
      ],
    },
    {
      provide: FindWasteMovementsUseCase,
      useFactory: (
        stockMovementRepository: StockMovementRepository,
        loggedUserService: LoggedUserService,
      ) =>
        new FindWasteMovementsUseCase(stockMovementRepository, loggedUserService),
      inject: [PROVIDERS.STOCK_MOVEMENT_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
  ],
  exports: [AdjustProductStockUseCase],
})
export class StockMovementModule {}
