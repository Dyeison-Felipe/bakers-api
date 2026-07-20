import { PROVIDERS } from '@/shared/application/constants/providers';
import { Module } from '@nestjs/common';
import { CategoryRepositoryImpl } from './database/typeorm/repositories/category.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategorySchema } from './database/typeorm/schema/category.schema';
import { FindAllCategoriesByCompanyUseCase } from '../application/usecase/find-all-categories.usecase';
import { CategoryRepository } from '../domain/repositories/category.repository';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { CreateCategoryUseCase } from '../application/usecase/create-category.usecase';
import { UpdateCategoryByCompanyUseCase } from '../application/usecase/update-category.usecase';
import { CategoryController } from './controllers/category.controller';
import { DeleteCategoryByCompanyUseCase } from '../application/usecase/delete-category.usecase';
import { CategoryPersistenceModule } from './category-persistence.module';
import { ProductPersistenceModule } from '@/core/product/infra/product-persistence.module';
import { ProductQueryRepository } from '@/core/product/domain/repositories/product.query';

@Module({
  imports: [CategoryPersistenceModule, ProductPersistenceModule],
  controllers: [CategoryController],
  providers: [
    {
      provide: FindAllCategoriesByCompanyUseCase,
      useFactory: (
        categoryRepository: CategoryRepository,
        loggedUserService: LoggedUserService,
      ) => {
        return new FindAllCategoriesByCompanyUseCase(
          categoryRepository,
          loggedUserService,
        );
      },
      inject: [PROVIDERS.CATEGORY_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
    {
      provide: CreateCategoryUseCase,
      useFactory: (
        categoryRepository: CategoryRepository,
        loggedUserService: LoggedUserService,
      ) => {
        return new CreateCategoryUseCase(categoryRepository, loggedUserService);
      },
      inject: [PROVIDERS.CATEGORY_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
    {
      provide: UpdateCategoryByCompanyUseCase,
      useFactory: (
        categoryRepository: CategoryRepository,
        loggedUserService: LoggedUserService,
      ) => {
        return new UpdateCategoryByCompanyUseCase(
          categoryRepository,
          loggedUserService,
        );
      },
      inject: [PROVIDERS.CATEGORY_REPOSITORY, PROVIDERS.LOGGED_USER_SERVICE],
    },
    {
      provide: DeleteCategoryByCompanyUseCase,
      useFactory: (
        categoryRepository: CategoryRepository,
        productQueryRepository: ProductQueryRepository,
        loggedUserService: LoggedUserService,
      ) => {
        return new DeleteCategoryByCompanyUseCase(
          categoryRepository,
          productQueryRepository,
          loggedUserService,
        );
      },
      inject: [
        PROVIDERS.CATEGORY_REPOSITORY,
        PROVIDERS.PRODUCT_QUERY_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
  ],
  exports: [],
})
export class CategoryModule {}
