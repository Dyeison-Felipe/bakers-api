import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { ProductSchema } from './database/typeorm/schema/product.schema';
import { ProductRepositoryImpl } from './database/typeorm/repository/product.repository';
import { ProductQueryRepositoryImpl } from './database/typeorm/repository/query/product.query';
import { ProductRecipeItemRepositoryImpl } from './database/typeorm/repository/product-recipe-item.repository';
import { ProductRecipeItemSchema } from './database/typeorm/schema/product-recipe-item';
import { ProductAdditionalCostRepositoryImpl } from './database/typeorm/repository/product-additional-cost.repository';
import { ProductAdditionalCostSchema } from './database/typeorm/schema/product-additional-cost.schema';

@Module({
  imports: [TypeOrmModule.forFeature([ProductSchema, ProductRecipeItemSchema, ProductAdditionalCostSchema])],
  providers: [
    { provide: PROVIDERS.PRODUCT_REPOSITORY, useClass: ProductRepositoryImpl },
    {
      provide: PROVIDERS.PRODUCT_QUERY_REPOSITORY,
      useClass: ProductQueryRepositoryImpl,
    },
    {
      provide: PROVIDERS.PRODUCT_RECIPE_ITEM,
      useClass: ProductRecipeItemRepositoryImpl,
    },
    {
      provide: PROVIDERS.PRODUCT_ADDITIONAL_COST_REPOSITORY,
      useClass: ProductAdditionalCostRepositoryImpl,
    },
  ],
  exports: [
    PROVIDERS.PRODUCT_REPOSITORY,
    PROVIDERS.PRODUCT_QUERY_REPOSITORY,
    PROVIDERS.PRODUCT_RECIPE_ITEM,
    PROVIDERS.PRODUCT_ADDITIONAL_COST_REPOSITORY,
  ],
})
export class ProductPersistenceModule {}
