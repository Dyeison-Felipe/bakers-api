import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { BatchSchema } from './database/typeorm/schema/batch.schema';
import { BatchMovementSchema } from './database/typeorm/schema/batch-movement.schema';
import { BatchRepositoryImpl } from './database/typeorm/repository/batch.repository';
import { BatchMovementRepositoryImpl } from './database/typeorm/repository/batch-movement.repository';

@Module({
  imports: [TypeOrmModule.forFeature([BatchSchema, BatchMovementSchema])],
  providers: [
    { provide: PROVIDERS.BATCH_REPOSITORY, useClass: BatchRepositoryImpl },
    {
      provide: PROVIDERS.BATCH_MOVEMENT_REPOSITORY,
      useClass: BatchMovementRepositoryImpl,
    },
  ],
  exports: [PROVIDERS.BATCH_REPOSITORY, PROVIDERS.BATCH_MOVEMENT_REPOSITORY],
})
export class BatchPersistenceModule {}
