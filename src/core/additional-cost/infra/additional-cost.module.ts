import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdditionalCostSchema } from './database/typeorm/schema/additional-cost.schema';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { AdditionalCostRepositoryImpl } from './database/typeorm/repositories/additional-cost.repository';
import { UpdateAdditionalCostUseCase } from '../application/usecases/update-additional-cost.usecase';
import { AdditionalCostRepository } from '../domain/repositories/additional-cost.repository';
import { CreateAdditionalCostUseCase } from '../application/usecases/create-additional-cost.usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { DeleteAdditionalCostUseCase } from '../application/usecases/delete-additional-cost.usecase';
import { FindAdditionalCostByIdUseCase } from '../application/usecases/find-additional-cost-by-id.usecase';
import { FindAllAdditionalCostsByCompanyUseCase } from '../application/usecases/find-all-additional-costs-by-company.usecase';
import { AdditionalCostController } from './controller/additional-cost.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AdditionalCostSchema])],
  controllers: [AdditionalCostController],
  providers: [
    {
      provide: PROVIDERS.ADDITIONAL_COST_REPOSITORY,
      useClass: AdditionalCostRepositoryImpl,
    },
    {
      provide: CreateAdditionalCostUseCase,
      useFactory: (
        additionalCostRepository: AdditionalCostRepository,
        loggedUserService: LoggedUserService,
      ) => {
        return new CreateAdditionalCostUseCase(
          additionalCostRepository,
          loggedUserService,
        );
      },
      inject: [
        PROVIDERS.ADDITIONAL_COST_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    {
      provide: UpdateAdditionalCostUseCase,
      useFactory: (
        additionalCostRepository: AdditionalCostRepository,
        loggedUserService: LoggedUserService,
      ) => {
        return new UpdateAdditionalCostUseCase(
          additionalCostRepository,
          loggedUserService,
        );
      },
      inject: [
        PROVIDERS.ADDITIONAL_COST_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    {
      provide: DeleteAdditionalCostUseCase,
      useFactory: (additionalCostRepository: AdditionalCostRepository) => {
        return new DeleteAdditionalCostUseCase(additionalCostRepository);
      },
      inject: [PROVIDERS.ADDITIONAL_COST_REPOSITORY],
    },
    {
      provide: FindAdditionalCostByIdUseCase,
      useFactory: (additionalCostRepository: AdditionalCostRepository) => {
        return new FindAdditionalCostByIdUseCase(additionalCostRepository);
      },
      inject: [
        PROVIDERS.ADDITIONAL_COST_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
    {
      provide: FindAllAdditionalCostsByCompanyUseCase,
      useFactory: (
        additionalCostRepository: AdditionalCostRepository,
        loggedUserService: LoggedUserService,
      ) => {
        return new FindAllAdditionalCostsByCompanyUseCase(
          additionalCostRepository,
          loggedUserService,
        );
      },
      inject: [
        PROVIDERS.ADDITIONAL_COST_REPOSITORY,
        PROVIDERS.LOGGED_USER_SERVICE,
      ],
    },
  ],
  exports: [PROVIDERS.ADDITIONAL_COST_REPOSITORY],
})
export class AdditionalCostModule {}
