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
import { BadRequestError } from "@/shared/application/errors/bad-request-error";
import { StripeService } from "@/shared/application/stripe/stripe.service";

// Limite do Stripe pra cobrança recorrente com interval:'day'.
const MAX_STRIPE_DAY_INTERVAL = 365;

type Input = {
  id: string;
  name: string;
  price: number;
  active: boolean;
  description: string;
  features: string[];
  duration: number;
  userLimit: number | null;
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
    @Inject(PROVIDERS.STRIPE_SERVICE)
    private readonly stripeService: StripeService,
  ) { }

  @Transactional()
  async execute({ id, active, description, features, duration, name, price, userLimit, permissionIds }: Input): Promise<Output> {
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

    await this.syncStripePrice(plan, { name, price, duration });

    plan.update({
      active: active,
      name: name,
      price: price,
      description: description,
      features: features,
      duration: duration,
      userLimit: userLimit,
    })

    await this.planRepository.update(plan);

    const planPermissions = await this.syncPlanPermissions(plan, permissions);

    const output: Output = {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      active: plan.active,
      description: plan.description,
      features: plan.features,
      duration: plan.duration,
      userLimit: plan.userLimit,
      permissions: planPermissions.map((planPermission) => ({
        id: planPermission.permission.id,
        action: planPermission.permission.action,
        subject: planPermission.permission.subject,
        description: planPermission.permission.description,
      })),
    }

    return output;
  }

  // Price é imutável no Stripe: se o valor ou a duração mudaram (ou o plano
  // passou a ser pago agora), arquiva o Price antigo e cria um novo sob o
  // mesmo Product. Se só o nome mudou, só atualiza o Product. Se o plano
  // deixou de ser pago, arquiva o Price e limpa os ids.
  private async syncStripePrice(
    plan: Plan,
    next: { name: string; price: number; duration: number },
  ): Promise<void> {
    const wasPaid = plan.price > 0;
    const willBePaid = next.price > 0;

    if (!willBePaid) {
      if (wasPaid && plan.stripePriceId) {
        await this.stripeService.archivePrice(plan.stripePriceId);
      }
      if (wasPaid) {
        plan.assignStripeIds(null, null);
      }
      return;
    }

    if (next.duration > MAX_STRIPE_DAY_INTERVAL) {
      throw new BadRequestError(
        `Planos pagos só podem ter duração de até ${MAX_STRIPE_DAY_INTERVAL} dias (limite do Stripe para cobrança recorrente)`,
      );
    }

    let stripeProductId = plan.stripeProductId;

    if (!stripeProductId) {
      stripeProductId = await this.stripeService.createProduct(next.name);
    } else if (plan.name !== next.name) {
      await this.stripeService.updateProduct(stripeProductId, next.name);
    }

    // Também precisa criar um Price quando o plano já era pago mas ainda não
    // tem um configurado (ex: plano criado antes da integração com o Stripe
    // existir) — não é só sobre o valor/duração terem mudado.
    const priceChanged =
      !wasPaid ||
      !plan.stripePriceId ||
      plan.price !== next.price ||
      plan.duration !== next.duration;

    if (!priceChanged) {
      plan.assignStripeIds(stripeProductId, plan.stripePriceId);
      return;
    }

    if (plan.stripePriceId) {
      await this.stripeService.archivePrice(plan.stripePriceId);
    }

    const stripePriceId = await this.stripeService.createPrice({
      productId: stripeProductId,
      unitAmountCents: Math.round(next.price * 100),
      intervalDays: next.duration,
    });

    plan.assignStripeIds(stripeProductId, stripePriceId);
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
