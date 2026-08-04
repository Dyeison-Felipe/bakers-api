import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { SaleSchema } from './database/typeorm/schema/sale.schema';
import { SaleItemSchema } from './database/typeorm/schema/sale-item.schema';
import { SaleRepositoryImpl } from './database/typeorm/repository/sale.repository';
import { SaleItemRepositoryImpl } from './database/typeorm/repository/sale-item.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SaleSchema, SaleItemSchema])],
  providers: [
    {
      provide: PROVIDERS.SALE_REPOSITORY,
      useClass: SaleRepositoryImpl,
    },
    {
      provide: PROVIDERS.SALE_ITEM_REPOSITORY,
      useClass: SaleItemRepositoryImpl,
    },
  ],
  exports: [PROVIDERS.SALE_REPOSITORY, PROVIDERS.SALE_ITEM_REPOSITORY],
})
export class SalePersistenceModule {}
