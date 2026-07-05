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

@Module({
  imports: [TypeOrmModule.forFeature([ProductSchema]), CategoryModule],
  controllers: [ProductController],
  providers: [
    {
      provide: PROVIDERS.PRODUCT_REPOSITORY,
      useClass: ProductRepositoryImpl,
    },
    {
      provide: CreateProductUseCase,
      useFactory: (
        productRepository: ProductRepository,
        loggedUserService: LoggedUserService,
        categoryRepository: CategoryRepository,
      ) => {
        return new CreateProductUseCase(
          productRepository,
          loggedUserService,
          categoryRepository,
        );
      },
      inject: [
        PROVIDERS.PRODUCT_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
        PROVIDERS.CATEGORY_REPOSITORY,
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
  ],
  exports: [PROVIDERS.PRODUCT_REPOSITORY],
})
export class ProductModule {}
