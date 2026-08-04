import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { DailyProductionSchema } from './database/typeorm/schema/daily-production.schema';
import { DailyProductionItemSchema } from './database/typeorm/schema/daily-production-item.schema';
import { DailyProductionRepositoryImpl } from './database/typeorm/repository/daily-production.repository';
import { DailyProductionItemRepositoryImpl } from './database/typeorm/repository/daily-production-item.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([DailyProductionSchema, DailyProductionItemSchema]),
  ],
  providers: [
    {
      provide: PROVIDERS.DAILY_PRODUCTION_REPOSITORY,
      useClass: DailyProductionRepositoryImpl,
    },
    {
      provide: PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY,
      useClass: DailyProductionItemRepositoryImpl,
    },
  ],
  exports: [
    PROVIDERS.DAILY_PRODUCTION_REPOSITORY,
    PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY,
  ],
})
export class DailyProductionPersistenceModule {}
