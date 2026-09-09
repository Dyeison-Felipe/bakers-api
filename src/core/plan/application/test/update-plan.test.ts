import { UpdatePlanUseCase } from '../usecase/update-plan.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { makePermission, makePlan } from './fixtures';
import type { PlanRepository } from '../../domain/repositories/plan.repository';
import type { PermissionRepository } from '@/core/permission/domain/repositories/permission.repository';
import type { PlanPermissionRepository } from '@/core/plan-permission/domain/repositories/plan-permission.repository';
import type { StripeService } from '@/shared/application/stripe/stripe.service';

describe('UpdatePlanUseCase', () => {
  let planRepository: jest.Mocked<Pick<PlanRepository, 'findById' | 'update'>>;
  let permissionRepository: jest.Mocked<Pick<PermissionRepository, 'findPermissionsById'>>;
  let planPermissionRepository: jest.Mocked<
    Pick<PlanPermissionRepository, 'deleteAllByPlanId' | 'saveMany'>
  >;
  let stripeService: jest.Mocked<
    Pick<StripeService, 'createProduct' | 'updateProduct' | 'createPrice' | 'archivePrice'>
  >;
  let sut: UpdatePlanUseCase;

  const input = {
    id: 'plan-1',
    name: 'Plano Atualizado',
    price: 200,
    active: true,
    description: 'Descrição nova',
    features: ['Controle de estoque'],
    duration: 365,
    userLimit: 10,
    permissionIds: ['permission-1'],
  };

  beforeEach(() => {
    planRepository = {
      findById: jest.fn().mockResolvedValue(makePlan()),
      update: jest.fn().mockResolvedValue(undefined),
    };
    permissionRepository = {
      findPermissionsById: jest.fn().mockResolvedValue([makePermission({ id: 'permission-1' })]),
    };
    planPermissionRepository = {
      deleteAllByPlanId: jest.fn().mockResolvedValue(undefined),
      saveMany: jest.fn().mockImplementation(async (items) => items),
    };
    stripeService = {
      createProduct: jest.fn().mockResolvedValue('prod_123'),
      updateProduct: jest.fn().mockResolvedValue(undefined),
      createPrice: jest.fn().mockResolvedValue('price_123'),
      archivePrice: jest.fn().mockResolvedValue(undefined),
    };

    sut = new UpdatePlanUseCase(
      planRepository as unknown as PlanRepository,
      permissionRepository as unknown as PermissionRepository,
      planPermissionRepository as unknown as PlanPermissionRepository,
      stripeService as unknown as StripeService,
    );
  });

  it('should throw NotFoundError when the plan does not exist', async () => {
    planRepository.findById.mockResolvedValue(null);

    await expect(sut.execute(input)).rejects.toThrow(NotFoundError);
  });

  it('should throw NotFoundError when some permission ids do not exist', async () => {
    permissionRepository.findPermissionsById.mockResolvedValue([]);

    await expect(sut.execute(input)).rejects.toThrow(NotFoundError);
  });

  it('should replace all plan permissions (delete then re-save)', async () => {
    await sut.execute(input);

    expect(planPermissionRepository.deleteAllByPlanId).toHaveBeenCalledWith('plan-1');
    expect(planPermissionRepository.saveMany).toHaveBeenCalledTimes(1);
  });

  it('should update the plan fields and return the updated output', async () => {
    const plan = makePlan();
    planRepository.findById.mockResolvedValue(plan);

    const output = await sut.execute(input);

    expect(plan.name).toBe('Plano Atualizado');
    expect(plan.price).toBe(200);
    expect(plan.duration).toBe(365);
    expect(plan.userLimit).toBe(10);
    expect(plan.features).toEqual(['Controle de estoque']);
    expect(output.permissions).toEqual([
      { id: 'permission-1', action: 'reader', subject: 'product', description: 'Ler produtos' },
    ]);
  });

  it('should create a new Stripe Product+Price under the existing product when price/duration change', async () => {
    const plan = makePlan({ stripeProductId: 'prod_existing', stripePriceId: 'price_old' });
    planRepository.findById.mockResolvedValue(plan);

    await sut.execute(input);

    expect(stripeService.createProduct).not.toHaveBeenCalled();
    expect(stripeService.archivePrice).toHaveBeenCalledWith('price_old');
    expect(stripeService.createPrice).toHaveBeenCalledWith({
      productId: 'prod_existing',
      unitAmountCents: 20000,
      intervalDays: 365,
    });
  });

  it('should create a Stripe Product+Price for a plan that was already paid before Stripe existed (no price/duration change)', async () => {
    const plan = makePlan({
      price: input.price,
      duration: input.duration,
      stripeProductId: null,
      stripePriceId: null,
    });
    planRepository.findById.mockResolvedValue(plan);

    await sut.execute(input);

    expect(stripeService.createProduct).toHaveBeenCalledWith(input.name);
    expect(stripeService.createPrice).toHaveBeenCalledWith({
      productId: 'prod_123',
      unitAmountCents: input.price * 100,
      intervalDays: input.duration,
    });
    expect(plan.stripePriceId).toBe('price_123');
  });

  it('should archive the price and clear the Stripe ids when the plan becomes free', async () => {
    const plan = makePlan({ stripeProductId: 'prod_existing', stripePriceId: 'price_old' });
    planRepository.findById.mockResolvedValue(plan);

    await sut.execute({ ...input, price: 0 });

    expect(stripeService.archivePrice).toHaveBeenCalledWith('price_old');
    expect(plan.stripeProductId).toBeNull();
    expect(plan.stripePriceId).toBeNull();
  });
});
