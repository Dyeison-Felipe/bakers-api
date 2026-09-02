import { Global, Module } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { MercadoPagoServiceImpl } from './mercado-pago.service';

@Global()
@Module({
  providers: [
    {
      provide: PROVIDERS.MERCADO_PAGO_SERVICE,
      useClass: MercadoPagoServiceImpl,
    },
  ],
  exports: [PROVIDERS.MERCADO_PAGO_SERVICE],
})
export class MercadoPagoModule {}
