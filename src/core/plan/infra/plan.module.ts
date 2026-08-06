import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanSchema } from './database/typeorm/schema/plan.schema';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { PlanRepositoryImpl } from './database/typeorm/repositories/plan.repository';
import { PlanRepository } from '../domain/repositories/plan.repository';
import { CreatePlanUseCase } from '../application/usecase/create-plan.usecase';
import { PlanController } from './controllers/plan.controller';
import { UpdatePlanUseCase } from '../application/usecase/update-plan.usecase';
import { FindAllPlanUseCase } from '../application/usecase/find-all-plan.usecase';
import { FindPlanByIdUseCase } from '../application/usecase/find-plan-by-id.usecase';
import { DeletePlanUseCase } from '../application/usecase/delete.usecase';
import { PermissionRepository } from '@/core/permission/domain/repositories/permission.repository';
import { PlanPermissionRepository } from '@/core/plan-permission/domain/repositories/plan-permission.repository';
import { PlanPermissionModule } from '@/core/plan-permission/infra/plan-permission.module';
import { PermissionModule } from '@/core/permission/infra/permission.module';

@Module({
  imports: [TypeOrmModule.forFeature([PlanSchema]), PermissionModule, PlanPermissionModule],
  controllers: [PlanController],
  providers: [
    {
      provide: PROVIDERS.PLAN_REPOSITORY,
      useClass: PlanRepositoryImpl,
    },
    {
      provide: CreatePlanUseCase,
      useFactory: (
        planRepository: PlanRepository,
        permissionRepository: PermissionRepository,
        planPermissionRepository: PlanPermissionRepository,
      ) => {
        return new CreatePlanUseCase(
          planRepository,
          permissionRepository,
          planPermissionRepository,
        );
      },
      inject: [
        PROVIDERS.PLAN_REPOSITORY,
        PROVIDERS.PERMISSION_REPOSITORY,
        PROVIDERS.PLAN_PERMISSION_REPOSITORY,
      ],
    },
    {
      provide: UpdatePlanUseCase,
      useFactory: (
        planRepository: PlanRepository,
        permissionRepository: PermissionRepository,
        planPermissionRepository: PlanPermissionRepository,
      ) => {
        return new UpdatePlanUseCase(
          planRepository,
          permissionRepository,
          planPermissionRepository,
        );
      },
      inject: [
        PROVIDERS.PLAN_REPOSITORY,
        PROVIDERS.PERMISSION_REPOSITORY,
        PROVIDERS.PLAN_PERMISSION_REPOSITORY,
      ],
    },
    {
      provide: FindAllPlanUseCase,
      useFactory: (planRepository: PlanRepository) => {
        return new FindAllPlanUseCase(planRepository);
      },
      inject: [PROVIDERS.PLAN_REPOSITORY],
    },
    {
      provide: FindPlanByIdUseCase,
      useFactory: (planRepository: PlanRepository) => {
        return new FindPlanByIdUseCase(planRepository);
      },
      inject: [PROVIDERS.PLAN_REPOSITORY],
    },
    {
      provide: DeletePlanUseCase,
      useFactory: (planRepository: PlanRepository) => {
        return new DeletePlanUseCase(planRepository);
      },
      inject: [PROVIDERS.PLAN_REPOSITORY],
    },
  ],
  exports: [PROVIDERS.PLAN_REPOSITORY],
})
export class PlanModule {}
