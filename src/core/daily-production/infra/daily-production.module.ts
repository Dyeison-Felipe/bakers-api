import { Module } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { ProductPersistenceModule } from '@/core/product/infra/product-persistence.module';
import { ProductRepository } from '@/core/product/domain/repositories/product.repository';
import { ProductRecipeLinkRepository } from '@/core/product/domain/repositories/product-recipe-link.repository';
import { RecipePersistenceModule } from '@/core/recipe/infra/recipe-persistence.module';
import { RecipeItemRepository } from '@/core/recipe/domain/repositories/recipe-item.repository';
import { StockMovementModule } from '@/core/stock-movement/infra/stock-movement.module';
import { AdjustProductStockUseCase } from '@/core/stock-movement/application/usecase/adjust-product-stock.usecase';
import { DailyProductionPersistenceModule } from './daily-production-persistence.module';
import { DailyProductionRepository } from '../domain/repositories/daily-production.repository';
import { DailyProductionItemRepository } from '../domain/repositories/daily-production-item.repository';
import { DailyProductionController } from './controllers/daily-production.controller';
import { CreateDailyProductionUseCase } from '../application/usecase/create-daily-production.usecase';
import { AddDailyProductionItemUseCase } from '../application/usecase/add-daily-production-item.usecase';
import { AddDailyProductionItemsUseCase } from '../application/usecase/add-daily-production-items.usecase';
import { RemoveDailyProductionItemUseCase } from '../application/usecase/remove-daily-production-item.usecase';
import { MarkDailyProductionItemAsProducedUseCase } from '../application/usecase/mark-item-as-produced.usecase';
import { UpdateDailyProductionItemUseCase } from '../application/usecase/update-daily-production-item.usecase';
import { CancelDailyProductionItemUseCase } from '../application/usecase/cancel-daily-production-item.usecase';
import { FindDailyProductionItemRequirementsUseCase } from '../application/usecase/find-daily-production-item-requirements.usecase';
import { FindDailyProductionByIdUseCase } from '../application/usecase/find-daily-production-by-id.usecase';
import { FindAllDailyProductionsUseCase } from '../application/usecase/find-all-daily-productions.usecase';

@Module({
  imports: [
    DailyProductionPersistenceModule,
    ProductPersistenceModule,
    RecipePersistenceModule,
    StockMovementModule,
  ],
  controllers: [DailyProductionController],
  providers: [
    {
      provide: AddDailyProductionItemUseCase,
      useFactory: (
        dailyProductionRepository: DailyProductionRepository,
        dailyProductionItemRepository: DailyProductionItemRepository,
        productRepository: ProductRepository,
        loggedUserService: LoggedUserService,
      ) =>
        new AddDailyProductionItemUseCase(
          dailyProductionRepository,
          dailyProductionItemRepository,
          productRepository,
          loggedUserService,
        ),
      inject: [
        PROVIDERS.DAILY_PRODUCTION_REPOSITORY,
        PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY,
        PROVIDERS.PRODUCT_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    {
      provide: AddDailyProductionItemsUseCase,
      useFactory: (
        dailyProductionRepository: DailyProductionRepository,
        dailyProductionItemRepository: DailyProductionItemRepository,
        loggedUserService: LoggedUserService,
        addDailyProductionItemUseCase: AddDailyProductionItemUseCase,
      ) =>
        new AddDailyProductionItemsUseCase(
          dailyProductionRepository,
          dailyProductionItemRepository,
          loggedUserService,
          addDailyProductionItemUseCase,
        ),
      inject: [
        PROVIDERS.DAILY_PRODUCTION_REPOSITORY,
        PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
        AddDailyProductionItemUseCase,
      ],
    },
    {
      provide: CreateDailyProductionUseCase,
      useFactory: (
        dailyProductionRepository: DailyProductionRepository,
        loggedUserService: LoggedUserService,
        addDailyProductionItemUseCase: AddDailyProductionItemUseCase,
      ) =>
        new CreateDailyProductionUseCase(
          dailyProductionRepository,
          loggedUserService,
          addDailyProductionItemUseCase,
        ),
      inject: [
        PROVIDERS.DAILY_PRODUCTION_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
        AddDailyProductionItemUseCase,
      ],
    },
    {
      provide: RemoveDailyProductionItemUseCase,
      useFactory: (
        dailyProductionItemRepository: DailyProductionItemRepository,
        loggedUserService: LoggedUserService,
      ) =>
        new RemoveDailyProductionItemUseCase(
          dailyProductionItemRepository,
          loggedUserService,
        ),
      inject: [
        PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    {
      provide: MarkDailyProductionItemAsProducedUseCase,
      useFactory: (
        dailyProductionRepository: DailyProductionRepository,
        dailyProductionItemRepository: DailyProductionItemRepository,
        loggedUserService: LoggedUserService,
        adjustProductStockUseCase: AdjustProductStockUseCase,
      ) =>
        new MarkDailyProductionItemAsProducedUseCase(
          dailyProductionRepository,
          dailyProductionItemRepository,
          loggedUserService,
          adjustProductStockUseCase,
        ),
      inject: [
        PROVIDERS.DAILY_PRODUCTION_REPOSITORY,
        PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
        AdjustProductStockUseCase,
      ],
    },
    {
      provide: FindDailyProductionByIdUseCase,
      useFactory: (
        dailyProductionRepository: DailyProductionRepository,
        dailyProductionItemRepository: DailyProductionItemRepository,
        loggedUserService: LoggedUserService,
      ) =>
        new FindDailyProductionByIdUseCase(
          dailyProductionRepository,
          dailyProductionItemRepository,
          loggedUserService,
        ),
      inject: [
        PROVIDERS.DAILY_PRODUCTION_REPOSITORY,
        PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    {
      provide: FindAllDailyProductionsUseCase,
      useFactory: (
        dailyProductionRepository: DailyProductionRepository,
        dailyProductionItemRepository: DailyProductionItemRepository,
        loggedUserService: LoggedUserService,
      ) =>
        new FindAllDailyProductionsUseCase(
          dailyProductionRepository,
          dailyProductionItemRepository,
          loggedUserService,
        ),
      inject: [
        PROVIDERS.DAILY_PRODUCTION_REPOSITORY,
        PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    {
      provide: UpdateDailyProductionItemUseCase,
      useFactory: (
        dailyProductionItemRepository: DailyProductionItemRepository,
        loggedUserService: LoggedUserService,
      ) =>
        new UpdateDailyProductionItemUseCase(
          dailyProductionItemRepository,
          loggedUserService,
        ),
      inject: [
        PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    {
      provide: CancelDailyProductionItemUseCase,
      useFactory: (
        dailyProductionRepository: DailyProductionRepository,
        dailyProductionItemRepository: DailyProductionItemRepository,
        loggedUserService: LoggedUserService,
      ) =>
        new CancelDailyProductionItemUseCase(
          dailyProductionRepository,
          dailyProductionItemRepository,
          loggedUserService,
        ),
      inject: [
        PROVIDERS.DAILY_PRODUCTION_REPOSITORY,
        PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    {
      provide: FindDailyProductionItemRequirementsUseCase,
      useFactory: (
        dailyProductionItemRepository: DailyProductionItemRepository,
        productRecipeLinkRepository: ProductRecipeLinkRepository,
        recipeItemRepository: RecipeItemRepository,
        loggedUserService: LoggedUserService,
      ) =>
        new FindDailyProductionItemRequirementsUseCase(
          dailyProductionItemRepository,
          productRecipeLinkRepository,
          recipeItemRepository,
          loggedUserService,
        ),
      inject: [
        PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY,
        PROVIDERS.PRODUCT_RECIPE_LINK_REPOSITORY,
        PROVIDERS.RECIPE_ITEM_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
  ],
  exports: [],
})
export class DailyProductionModule {}
