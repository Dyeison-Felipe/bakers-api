import { Global, Module } from '@nestjs/common';
import { EnvConfigModule } from '@/shared/infra/env-config/env-config.module';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { StorageServiceImpl } from './storage.service';

@Global()
@Module({
  imports: [EnvConfigModule],
  providers: [
    {
      provide: PROVIDERS.STORAGE_SERVICE,
      useClass: StorageServiceImpl,
    },
  ],
  exports: [PROVIDERS.STORAGE_SERVICE],
})
export class StorageModule {}