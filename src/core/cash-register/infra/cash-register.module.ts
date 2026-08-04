import { Module } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { SalePersistenceModule } from '@/core/sale/infra/sale-persistence.module';
import { SaleRepository } from '@/core/sale/domain/repositories/sale.repository';
import { CashRegisterPersistenceModule } from './cash-register-persistence.module';
import { CashRegisterSessionRepository } from '../domain/repositories/cash-register-session.repository';
import { CashRegisterController } from './controllers/cash-register.controller';
import { OpenCashRegisterSessionUseCase } from '../application/usecase/open-cash-register-session.usecase';
import { FindOpenCashRegisterSessionUseCase } from '../application/usecase/find-open-cash-register-session.usecase';
import { CloseCashRegisterSessionUseCase } from '../application/usecase/close-cash-register-session.usecase';

@Module({
  imports: [CashRegisterPersistenceModule, SalePersistenceModule],
  controllers: [CashRegisterController],
  providers: [
    {
      provide: OpenCashRegisterSessionUseCase,
      useFactory: (
        cashRegisterSessionRepository: CashRegisterSessionRepository,
        loggedUserService: LoggedUserService,
      ) =>
        new OpenCashRegisterSessionUseCase(
          cashRegisterSessionRepository,
          loggedUserService,
        ),
      inject: [
        PROVIDERS.CASH_REGISTER_SESSION_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    {
      provide: FindOpenCashRegisterSessionUseCase,
      useFactory: (
        cashRegisterSessionRepository: CashRegisterSessionRepository,
        loggedUserService: LoggedUserService,
      ) =>
        new FindOpenCashRegisterSessionUseCase(
          cashRegisterSessionRepository,
          loggedUserService,
        ),
      inject: [
        PROVIDERS.CASH_REGISTER_SESSION_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    {
      provide: CloseCashRegisterSessionUseCase,
      useFactory: (
        cashRegisterSessionRepository: CashRegisterSessionRepository,
        saleRepository: SaleRepository,
        loggedUserService: LoggedUserService,
      ) =>
        new CloseCashRegisterSessionUseCase(
          cashRegisterSessionRepository,
          saleRepository,
          loggedUserService,
        ),
      inject: [
        PROVIDERS.CASH_REGISTER_SESSION_REPOSITORY,
        PROVIDERS.SALE_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
  ],
  exports: [],
})
export class CashRegisterModule {}
