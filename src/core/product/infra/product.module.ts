import { Inject, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductSchema } from './database/typeorm/schema/product.schema';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { ProductRepositoryImpl } from './database/typeorm/repository/product.repository';
import { CategoryModule } from '@/core/category/infra/category.module';
import { CreateProductUseCase } from '../application/usecase/create-product.usecase';
import { ProductRepository } from '../domain/repositories/product.repository';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { CategoryRepository } from '@/core/category/domain/repositories/category.repository';
import { ProductController } from './controllers/product.controller';
import { FindAllProductByCompanyUseCase } from '../application/usecase/find-all-product-by-company.usecase';
import { ProductPersistenceModule } from './product-persistence.module';
import { CategoryPersistenceModule } from '@/core/category/infra/category-persistence.module';
import { UpdateProductUseCase } from '../application/usecase/update-product.usecase';
import { UpdateStockProductUseCase } from '../application/usecase/increase-decrease-stock-product.usecase';
import { FindProductByIdAndCompanyId } from '../application/usecase/find-product-by-id.usecase';
import { StorageService } from '@/shared/application/storage/storage.service';
import { GetProductImageUseCase } from '../application/usecase/get-image.usecase';
import { ProductRecipeItemRepository } from '../domain/repositories/product-recipe-item.repository';
import { ProductAdditionalCostRepository } from '../domain/repositories/product-additional-cost.repository';
import { CalculateUnitCostUseCase } from '../application/usecase/calculate-unit-cost.usecase';
import { CalculateRecipeCostUseCase } from '../application/usecase/calculate-recipe-cost.usecase';
import {
  FindProductRecipeUseCase,
} from '../application/usecase/find-product-recipe-items.usecase';
import { AdditionalCostModule } from '@/core/additional-cost/infra/additional-cost.module';
import { AdditionalCostRepository } from '@/core/additional-cost/domain/repositories/additional-cost.repository';
import { FindLowStockProductsUseCase } from '../application/usecase/find-low-stock-products.usecase';

@Module({
  imports: [
    ProductPersistenceModule,
    CategoryPersistenceModule,
    AdditionalCostModule,
  ],
  controllers: [ProductController],
  providers: [
    {
      provide: CreateProductUseCase,
      useFactory: (
        productRepository: ProductRepository,
        loggedUserService: LoggedUserService,
        categoryRepository: CategoryRepository,
        storageService: StorageService,
        productRecipeItemRepository: ProductRecipeItemRepository,
        productAdditionalCostRepository: ProductAdditionalCostRepository,
        additionalCostRepository: AdditionalCostRepository,
      ) => {
        return new CreateProductUseCase(
          productRepository,
          loggedUserService,
          categoryRepository,
          storageService,
          productRecipeItemRepository,
          productAdditionalCostRepository,
          additionalCostRepository,
        );
      },
      inject: [
        PROVIDERS.PRODUCT_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
        PROVIDERS.CATEGORY_REPOSITORY,
        PROVIDERS.STORAGE_SERVICE,
        PROVIDERS.PRODUCT_RECIPE_ITEM,
        PROVIDERS.PRODUCT_ADDITIONAL_COST_REPOSITORY,
        PROVIDERS.ADDITIONAL_COST_REPOSITORY,
      ],
    },
    {
      provide: FindAllProductByCompanyUseCase,
      useFactory: (
        productRepository: ProductRepository,
        loggedUserService: LoggedUserService,
      ) => {
        return new FindAllProductByCompanyUseCase(
          productRepository,
          loggedUserService,
        );
      },
      inject: [PROVIDERS.PRODUCT_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
    {
      provide: UpdateProductUseCase,
      useFactory: (
        productRepository: ProductRepository,
        categoryRepository: CategoryRepository,
        loggedUserService: LoggedUserService,
        storageService: StorageService,
        productRecipeItemRepository: ProductRecipeItemRepository,
        productAdditionalCostRepository: ProductAdditionalCostRepository,
        additionalCostRepository: AdditionalCostRepository,
      ) => {
        return new UpdateProductUseCase(
          productRepository,
          categoryRepository,
          loggedUserService,
          storageService,
          productRecipeItemRepository,
          productAdditionalCostRepository,
          additionalCostRepository,
        );
      },
      inject: [
        PROVIDERS.PRODUCT_REPOSITORY,
        PROVIDERS.CATEGORY_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
        PROVIDERS.STORAGE_SERVICE,
        PROVIDERS.PRODUCT_RECIPE_ITEM,
        PROVIDERS.PRODUCT_ADDITIONAL_COST_REPOSITORY,
        PROVIDERS.ADDITIONAL_COST_REPOSITORY,
      ],
    },
    {
      provide: UpdateStockProductUseCase,
      useFactory: (
        productRepository: ProductRepository,
        loggedUserService: LoggedUserService,
      ) => {
        return new UpdateStockProductUseCase(
          productRepository,
          loggedUserService,
        );
      },
      inject: [PROVIDERS.PRODUCT_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
    {
      provide: FindProductByIdAndCompanyId,
      useFactory: (
        productRepository: ProductRepository,
        loggedUserService: LoggedUserService,
      ) => {
        return new FindProductByIdAndCompanyId(
          productRepository,
          loggedUserService,
        );
      },
      inject: [PROVIDERS.PRODUCT_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },

    {
      provide: GetProductImageUseCase,
      useFactory: (
        productRepository: ProductRepository,
        storageService: StorageService,
        loggedUserService: LoggedUserService,
      ) => {
        return new GetProductImageUseCase(
          productRepository,
          storageService,
          loggedUserService,
        );
      },
      inject: [
        PROVIDERS.PRODUCT_REPOSITORY,
        PROVIDERS.STORAGE_SERVICE,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    {
      provide: CalculateRecipeCostUseCase,
      useFactory: (
        productRepository: ProductRepository,
        loggedUserService: LoggedUserService,
        additionalCostRepository: AdditionalCostRepository,
      ) => {
        return new CalculateRecipeCostUseCase(
          productRepository,
          loggedUserService,
          additionalCostRepository,
        );
      },
      inject: [
        PROVIDERS.PRODUCT_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
        PROVIDERS.ADDITIONAL_COST_REPOSITORY,
      ],
    },
    {
      provide: CalculateUnitCostUseCase,
      useFactory: () => {
        return new CalculateUnitCostUseCase();
      },
      inject: [],
    },
    {
      provide: FindProductRecipeUseCase,
      useFactory: (
        productRecipeItemRepository: ProductRecipeItemRepository,
        productAdditionalCostRepository: ProductAdditionalCostRepository,
      ) => {
        return new FindProductRecipeUseCase(
          productRecipeItemRepository,
          productAdditionalCostRepository,
        );
      },
      inject: [
        PROVIDERS.PRODUCT_RECIPE_ITEM,
        PROVIDERS.PRODUCT_ADDITIONAL_COST_REPOSITORY,
      ],
    },
    {
      provide: FindLowStockProductsUseCase,
      useFactory: (
        productRepository: ProductRepository,
        loggedUserService: LoggedUserService,
      ) => {
        return new FindLowStockProductsUseCase(
          productRepository,
          loggedUserService,
        );
      },
      inject: [PROVIDERS.PRODUCT_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
  ],
  exports: [],
})
export class ProductModule {}
