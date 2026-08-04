import { Module } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { StorageService } from '@/shared/application/storage/storage.service';
import { ProductPersistenceModule } from '@/core/product/infra/product-persistence.module';
import { ProductRepository } from '@/core/product/domain/repositories/product.repository';
import { BatchModule } from '@/core/batch/infra/batch.module';
import { WriteOffBatchUseCase } from '@/core/batch/application/usecase/write-off-batch.usecase';
import { CashRegisterPersistenceModule } from '@/core/cash-register/infra/cash-register-persistence.module';
import { CashRegisterSessionRepository } from '@/core/cash-register/domain/repositories/cash-register-session.repository';
import { SalePersistenceModule } from './sale-persistence.module';
import { SaleRepository } from '../domain/repositories/sale.repository';
import { SaleItemRepository } from '../domain/repositories/sale-item.repository';
import { SaleController } from './controllers/sale.controller';
import { FindProductsForSaleUseCase } from '../application/usecase/find-products-for-sale.usecase';
import { FinalizeSaleUseCase } from '../application/usecase/finalize-sale.usecase';
import { FindSaleByIdUseCase } from '../application/usecase/find-sale-by-id.usecase';
import { FindAllSalesUseCase } from '../application/usecase/find-all-sales.usecase';
import { GetSaleReceiptUseCase } from '../application/usecase/get-sale-receipt.usecase';

@Module({
  imports: [
    SalePersistenceModule,
    ProductPersistenceModule,
    CashRegisterPersistenceModule,
    BatchModule,
  ],
  controllers: [SaleController],
  providers: [
    {
      provide: FindProductsForSaleUseCase,
      useFactory: (
        productRepository: ProductRepository,
        loggedUserService: LoggedUserService,
      ) =>
        new FindProductsForSaleUseCase(productRepository, loggedUserService),
      inject: [PROVIDERS.PRODUCT_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
    {
      provide: FinalizeSaleUseCase,
      useFactory: (
        productRepository: ProductRepository,
        cashRegisterSessionRepository: CashRegisterSessionRepository,
        saleRepository: SaleRepository,
        saleItemRepository: SaleItemRepository,
        storageService: StorageService,
        loggedUserService: LoggedUserService,
        writeOffBatchUseCase: WriteOffBatchUseCase,
      ) =>
        new FinalizeSaleUseCase(
          productRepository,
          cashRegisterSessionRepository,
          saleRepository,
          saleItemRepository,
          storageService,
          loggedUserService,
          writeOffBatchUseCase,
        ),
      inject: [
        PROVIDERS.PRODUCT_REPOSITORY,
        PROVIDERS.CASH_REGISTER_SESSION_REPOSITORY,
        PROVIDERS.SALE_REPOSITORY,
        PROVIDERS.SALE_ITEM_REPOSITORY,
        PROVIDERS.STORAGE_SERVICE,
        PROVIDERS.LOGGED_USER_SERVICE,
        WriteOffBatchUseCase,
      ],
    },
    {
      provide: FindSaleByIdUseCase,
      useFactory: (
        saleRepository: SaleRepository,
        saleItemRepository: SaleItemRepository,
        loggedUserService: LoggedUserService,
      ) =>
        new FindSaleByIdUseCase(
          saleRepository,
          saleItemRepository,
          loggedUserService,
        ),
      inject: [
        PROVIDERS.SALE_REPOSITORY,
        PROVIDERS.SALE_ITEM_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    {
      provide: FindAllSalesUseCase,
      useFactory: (
        saleRepository: SaleRepository,
        loggedUserService: LoggedUserService,
      ) => new FindAllSalesUseCase(saleRepository, loggedUserService),
      inject: [PROVIDERS.SALE_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
    {
      provide: GetSaleReceiptUseCase,
      useFactory: (
        saleRepository: SaleRepository,
        storageService: StorageService,
        loggedUserService: LoggedUserService,
      ) =>
        new GetSaleReceiptUseCase(
          saleRepository,
          storageService,
          loggedUserService,
        ),
      inject: [
        PROVIDERS.SALE_REPOSITORY,
        PROVIDERS.STORAGE_SERVICE,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
  ],
  exports: [],
})
export class SaleModule {}
