import { PROVIDERS } from '@/shared/application/constants/providers';
import { Module } from '@nestjs/common';
import { NcmRepositoryImpl } from './database/typeorm/repositories/ncm.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NcmSchema } from './database/typeorm/schema/ncm.schema';
import { SyncNcmUseCase } from '../application/usecase/sync-ncm.usecase';
import { SiscomexService } from '@/shared/application/siscomex/siscomex-ncm.interface';
import { NcmRepository } from '../domain/repositories/ncm.repository';
import { NcmController } from './controller/ncm.controller';
import { SiscomexModule } from '@/shared/infra/siscomex/siscomex.module';

@Module({
  imports: [TypeOrmModule.forFeature([NcmSchema]), SiscomexModule],
  controllers: [NcmController],
  providers: [
    {
      provide: PROVIDERS.NCM_REPOSITORY,
      useClass: NcmRepositoryImpl,
    },
    {
      provide: SyncNcmUseCase,
      useFactory: (
        siscomexService: SiscomexService,
        ncmRepository: NcmRepository,
      ) => {
        return new SyncNcmUseCase(siscomexService, ncmRepository);
      },
      inject: [PROVIDERS.SISCOMEX_SERVICE, PROVIDERS.NCM_REPOSITORY],
    },
  ],
  exports: [PROVIDERS.NCM_REPOSITORY],
})
export class NcmModule {}
