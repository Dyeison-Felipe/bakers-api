import { PROVIDERS } from "@/shared/application/constants/providers";
import { UseCase } from "@/shared/application/usecase/usecase";
import { Inject, InternalServerErrorException } from "@nestjs/common";
import { PlanRepository } from "../../domain/repositories/plan.repository";
import { ConflictError } from "@/shared/application/errors/conflict-error";
import { NotFoundError } from "@/shared/application/errors/not-found-error";
import { Plan } from "../../domain/entities/plan.entity";
import { UpdatePlanOutput } from "@/shared/application/output/plan/update-plan.output";
import { PermissionRepository } from "@/core/permission/domain/repositories/permission.repository";
import { PlanPermissionRepository } from "@/core/plan-permission/domain/repositories/plan-permission.repository";
import { PlanPermission } from "@/core/plan-permission/domain/entity/plan-permission.entity";
import { Permission } from "@/core/permission/domain/entity/permission.entity";
import { Transactional } from "@/shared/infra/database/typeorm/decorators/transactional.decorator";

type Input = {
  id: string;
  name: string;
  price: number;
  active: boolean;
  description: string;
  duration: string;
  permissionIds: string[];
}

type Output = UpdatePlanOutput

export class UpdatePlanUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.PLAN_REPOSITORY)
    private readonly planRepository: PlanRepository,
    @Inject(PROVIDERS.PERMISSION_REPOSITORY)
    private readonly permissionRepository: PermissionRepository,
    @Inject(PROVIDERS.PLAN_PERMISSION_REPOSITORY)
    private readonly planPermissionRepository: PlanPermissionRepository,
  ) { }

  @Transactional()
  async execute({ id, active, description, duration, name, price, permissionIds }: Input): Promise<Output> {
    const plan = await this.planRepository.findById(id);

    if (!plan) {
      throw new NotFoundError(`Plano não encontrado`);
    }

    const permissions = await this.permissionRepository.findPermissionsById(
      permissionIds,
    );

    if (permissions.length !== permissionIds.length) {
      const foundsIds = permissions.map((p) => p.id);
      const notFoundIds = permissionIds.filter(
        (permissionId) => !foundsIds.includes(permissionId),
      );

      throw new NotFoundError(
        `Permissões não encontradas: ${notFoundIds.join(', ')}`,
      );
    }

    plan.update({
      active: active,
      name: name,
      price: price,
      description: description,
      duration: duration
    })

    await this.planRepository.update(plan);

    const planPermissions = await this.syncPlanPermissions(plan, permissions);

    const output: Output = {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      active: plan.active,
      description: plan.description,
      duration: plan.duration,
      permissions: planPermissions.map((planPermission) => ({
        id: planPermission.permission.id,
        action: planPermission.permission.action,
        subject: planPermission.permission.subject,
        description: planPermission.permission.description,
      })),
    }

    return output;
  }

  private async syncPlanPermissions(
    plan: Plan,
    permissions: Permission[],
  ): Promise<PlanPermission[]> {
    try {
      await this.planPermissionRepository.deleteAllByPlanId(plan.id);

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
        `Ocorreu um erro ao atualizar as permissões do plano ${plan.name}`,
      );
    }
  }
}
