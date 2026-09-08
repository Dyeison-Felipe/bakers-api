import { Global, Module } from '@nestjs/common';
import { EnvConfigModule } from '@/shared/infra/env-config/env-config.module';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { StripeServiceImpl } from './stripe.service';

@Global()
@Module({
  imports: [EnvConfigModule],
  providers: [
    {
      provide: PROVIDERS.STRIPE_SERVICE,
      useClass: StripeServiceImpl,
    },
  ],
  exports: [PROVIDERS.STRIPE_SERVICE],
})
export class StripeModule {}
