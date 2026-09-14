import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { StockMovementSchema } from './database/typeorm/schema/stock-movement.schema';
import { StockMovementRepositoryImpl } from './database/typeorm/repository/stock-movement.repository';

@Module({
  imports: [TypeOrmModule.forFeature([StockMovementSchema])],
  providers: [
    {
      provide: PROVIDERS.STOCK_MOVEMENT_REPOSITORY,
      useClass: StockMovementRepositoryImpl,
    },
  ],
  exports: [PROVIDERS.STOCK_MOVEMENT_REPOSITORY],
})
export class StockMovementPersistenceModule {}
