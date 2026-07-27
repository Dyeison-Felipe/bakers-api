import { Module } from '@nestjs/common';
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

@Module({
  imports: [ProductPersistenceModule, CategoryPersistenceModule],
  controllers: [ProductController],
  providers: [
    {
      provide: CreateProductUseCase,
      useFactory: (
        productRepository: ProductRepository,
        loggedUserService: LoggedUserService,
        categoryRepository: CategoryRepository,
        storageService: StorageService,
      ) => {
        return new CreateProductUseCase(
          productRepository,
          loggedUserService,
          categoryRepository,
          storageService,
        );
      },
      inject: [
        PROVIDERS.PRODUCT_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
        PROVIDERS.CATEGORY_REPOSITORY,
        PROVIDERS.STORAGE_SERVICE,
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
        storageService: StorageService
      ) => {
        return new UpdateProductUseCase(
          productRepository,
          categoryRepository,
          loggedUserService,
          storageService,
        );
      },
      inject: [
        PROVIDERS.PRODUCT_REPOSITORY,
        PROVIDERS.CATEGORY_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
        PROVIDERS.STORAGE_SERVICE,
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
  ],
  exports: [],
})
export class ProductModule {}
