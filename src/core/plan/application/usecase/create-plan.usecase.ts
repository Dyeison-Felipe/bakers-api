import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject, InternalServerErrorException } from '@nestjs/common';
import { PlanRepository } from '../../domain/repositories/plan.repository';
import { CreatePlanInput } from '@/shared/application/input/plan/create-plan.input';
import { CreatePlanOutput } from '@/shared/application/output/plan/create-plan.output';
import { ConflictError } from '@/shared/application/errors/conflict-error';
import { Plan } from '../../domain/entities/plan.entity';
import { PermissionRepository } from '@/core/permission/domain/repositories/permission.repository';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { PlanPermissionRepository } from '@/core/plan-permission/domain/repositories/plan-permission.repository';
import { Transactional } from '@/shared/infra/database/typeorm/decorators/transactional.decorator';
import { PlanPermission } from '@/core/plan-permission/domain/entity/plan-permission.entity';
import { Permission } from '@/core/permission/domain/entity/permission.entity';

type Input = CreatePlanInput;

type Output = CreatePlanOutput;

export class CreatePlanUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.PLAN_REPOSITORY)
    private readonly planRepository: PlanRepository,
    @Inject(PROVIDERS.PERMISSION_REPOSITORY)
    private readonly permissionRepository: PermissionRepository,
    @Inject(PROVIDERS.PLAN_PERMISSION_REPOSITORY)
    private readonly planPermissionRepository: PlanPermissionRepository,
  ) {}

  @Transactional()
  async execute(input: Input): Promise<Output> {
    const existPlan = await this.planRepository.findByName(input.name);

    if (existPlan) {
      throw new ConflictError(`Já existe um plano com o nome ${input.name}`);
    }

    const permissions = await this.permissionRepository.findPermissionsById(
      input.permissionIds,
    );

    if (permissions.length !== input.permissionIds.length) {
      const foundsIds = permissions.map((p) => p.id);
      const notFoundIds = input.permissionIds.filter(
        (id) => !foundsIds.includes(id),
      );

      throw new NotFoundError(
        `Permissões não encontradas: ${notFoundIds.join(', ')}`,
      );
    }

    const createPlan = Plan.create({
      name: input.name,
      price: input.price,
      description: input.description,
      duration: input.duration,
      userLimit: input.userLimit,
    });

    const savePlan = await this.planRepository.save(createPlan);

    const planPermissions = await this.savePlanPermissions(
      savePlan,
      permissions,
    );

    return this.output(savePlan, planPermissions);
  }

  private async savePlanPermissions(
    plan: Plan,
    permissions: Permission[],
  ): Promise<PlanPermission[]> {
    try {
      const planPermissions = permissions.map((permission) =>
        PlanPermission.create({
          plan: plan,
          permission: permission,
        }),
      );

      const savedPlanPermissions =
        await this.planPermissionRepository.saveMany(planPermissions);

      return savedPlanPermissions;
    } catch (error) {
      throw new InternalServerErrorException(
        `Ocorreu um erro ao salvar as permissões no plano ${plan.name}`,
      );
    }
  }

  private output(plan: Plan, planPermissions: PlanPermission[]): Output {
    const permissions = planPermissions.map(
      (planPermission) => planPermission.permission,
    );

    const output: Output = {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      active: plan.active,
      description: plan.description,
      duration: plan.duration,
      userLimit: plan.userLimit,
      permissions: permissions.map((permission) => ({
        id: permission.id,
        action: permission.action,
        subject: permission.subject,
        description: permission.description
      })),
    };

    return output;
  }
}
