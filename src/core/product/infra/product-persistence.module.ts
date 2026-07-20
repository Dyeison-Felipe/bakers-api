import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { ProductSchema } from './database/typeorm/schema/product.schema';
import { ProductRepositoryImpl } from './database/typeorm/repository/product.repository';
import { ProductQueryRepositoryImpl } from './database/typeorm/repository/query/product.query';

@Module({
  imports: [TypeOrmModule.forFeature([ProductSchema])],
  providers: [
    { provide: PROVIDERS.PRODUCT_REPOSITORY, useClass: ProductRepositoryImpl },
    {provide: PROVIDERS.PRODUCT_QUERY_REPOSITORY, useClass: ProductQueryRepositoryImpl}
  ],
  exports: [PROVIDERS.PRODUCT_REPOSITORY, PROVIDERS.PRODUCT_QUERY_REPOSITORY],
})
export class ProductPersistenceModule {}