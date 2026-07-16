import { Module } from '@nestjs/common';
import { SiscomexServiceImpl } from './siscomex-ncm.service';
import { PROVIDERS } from '@/shared/application/constants/providers';

@Module({
  imports: [],
  providers: [
    {
      provide: PROVIDERS.SISCOMEX_SERVICE,
      useClass: SiscomexServiceImpl,
    },
  ],
  exports: [PROVIDERS.SISCOMEX_SERVICE],
})
export class SiscomexModule {}
