import { UseCase } from '@/shared/application/usecase/usecase';
import { PlanPermission } from '../../domain/entity/plan-permission.entity';
import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { PlanPermissionRepository } from '../../domain/repositories/plan-permission.repository';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { PlanPermissionOutput } from '@/shared/application/output/plan-permissions/plan-permissions.output';

type Input = void;

type Output = PlanPermissionOutput[];

export class FindAllPlanAndPermissionsUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.PLAN_PERMISSION_REPOSITORY)
    private readonly planPermissionRepository: PlanPermissionRepository,
  ) {}

  async execute(input: void): Promise<Output> {
    const plansPermissions =
      await this.planPermissionRepository.findAllPlansAndPermissions();

    if (!plansPermissions.length) {
      throw new NotFoundError('Nenhum plano encontrado');
    }

    return this.toOutput(plansPermissions);
  }

  private toOutput(plansPermissions: PlanPermission[]): Output {
    // Map é como um objeto chave-valor, mas mais poderoso
    // Map<string, PlanPermissionOutput> significa:
    // - chave: string (vai ser o plan.id)
    // - valor: PlanPermissionOutput (o objeto com plan + permissions[])
    // usamos Map aqui porque precisamos agrupar permissões pelo plano
    // ex: se temos 4 registros com o mesmo plan.id, queremos 1 entrada no Map com 4 permissions
    const map = new Map<string, PlanPermissionOutput>();

    // percorre cada planPermission que veio do banco
    // cada pp é: { id, plan: Plan, permission: Permission }
    for (const pp of plansPermissions) {
      // pega o id do plano para usar como chave do Map
      const planId = pp.plan.id;

      // map.has(planId) verifica se esse plano já foi adicionado ao Map
      // se NÃO existe ainda, cria uma entrada nova para esse plano
      if (!map.has(planId)) {
        // map.set(chave, valor) — adiciona uma entrada no Map
        // criamos o objeto do plano com permissions vazio []
        // nas próximas iterações com o mesmo planId, só vamos adicionar no array
        map.set(planId, {
          plan: {
            id: pp.plan.id,
            name: pp.plan.name,
            description: pp.plan.description,
            price: pp.plan.price,
            active: pp.plan.active,
            duration: pp.plan.duration,
            userLimit: pp.plan.userLimit,
          },
          permissions: [], // começa vazio, vai sendo preenchido abaixo
        });
      }

      // map.get(planId) — busca o valor pela chave no Map
      // o ! (non-null assertion) diz ao TypeScript que tenho certeza que existe
      // (podemos usar ! aqui porque garantimos a existência no if acima)
      // .permissions.push() adiciona a permission atual no array desse plano
      map.get(planId)!.permissions.push({
        description: pp.permission.description
      });

      // exemplo do que acontece com 3 registros do mesmo plano:
      // iteração 1: map não tem planId → cria entrada com permissions: []  → push permission1
      // iteração 2: map já tem planId  → não cria nada               → push permission2
      // iteração 3: map já tem planId  → não cria nada               → push permission3
      // resultado: { plan: {...}, permissions: [p1, p2, p3] }
    }

    // Array.from() converte o Map em array
    // map.values() retorna só os valores do Map (sem as chaves)
    // ex: Map { "uuid1" => {...}, "uuid2" => {...} }
    //     Array.from(map.values()) => [{...}, {...}]
    // isso é necessário porque o Output espera PlanPermissionOutput[], não um Map
    return Array.from(map.values());
  }
}
