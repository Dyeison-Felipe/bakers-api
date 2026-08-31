import { Plan } from '../../domain/entities/plan.entity';
import { Permission } from '@/core/permission/domain/entity/permission.entity';
import { PlanPermission } from '@/core/plan-permission/domain/entity/plan-permission.entity';

export const makePlan = (overrides: Record<string, unknown> = {}): Plan => {
  const plan = {
    id: 'plan-1',
    name: 'Plano Básico',
    price: 100,
    active: true,
    description: 'Plano básico',
    duration: 30,
    permissions: [] as Permission[],
    auditable: { createdAt: new Date(), updatedAt: new Date(), deletedAt: null as Date | null },
    update(props: { name: string; price: number; active: boolean; description: string; duration: number }) {
      this.name = props.name;
      this.price = props.price;
      this.description = props.description;
      this.active = props.active;
      this.duration = props.duration;
    },
    deleted() {
      this.active = false;
      this.auditable = { ...this.auditable, deletedAt: new Date() };
    },
    ...overrides,
  };
  Object.setPrototypeOf(plan, Plan.prototype);
  return plan as unknown as Plan;
};

export const makePermission = (overrides: Record<string, unknown> = {}): Permission => {
  const permission = {
    id: 'permission-1',
    action: 'reader',
    subject: 'product',
    description: 'Ler produtos',
    ...overrides,
  };
  Object.setPrototypeOf(permission, Permission.prototype);
  return permission as unknown as Permission;
};

export const makePlanPermission = (
  overrides: Record<string, unknown> = {},
): PlanPermission => {
  const planPermission = {
    id: 'plan-permission-1',
    plan: makePlan(),
    permission: makePermission(),
    ...overrides,
  };
  Object.setPrototypeOf(planPermission, PlanPermission.prototype);
  return planPermission as unknown as PlanPermission;
};
