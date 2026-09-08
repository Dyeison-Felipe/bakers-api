import { CreateSetupIntentUseCase } from '../usecase/create-setup-intent.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { makePlan } from './fixtures';
import type { PlanRepository } from '@/core/plan/domain/repositories/plan.repository';
import type { StripeService } from '@/shared/application/stripe/stripe.service';

describe('CreateSetupIntentUseCase', () => {
  let planRepository: jest.Mocked<Pick<PlanRepository, 'findById'>>;
  let stripeService: jest.Mocked<Pick<StripeService, 'createSetupIntent'>>;
  let sut: CreateSetupIntentUseCase;

  beforeEach(() => {
    planRepository = {
      findById: jest.fn().mockResolvedValue(makePlan({ price: 100 })),
    };
    stripeService = {
      createSetupIntent: jest
        .fn()
        .mockResolvedValue({ clientSecret: 'seti_secret_123', setupIntentId: 'seti_123' }),
    };

    sut = new CreateSetupIntentUseCase(
      planRepository as unknown as PlanRepository,
      stripeService as unknown as StripeService,
    );
  });

  it('should throw NotFoundError when the plan does not exist', async () => {
    planRepository.findById.mockResolvedValue(null);

    await expect(sut.execute({ planId: 'plan-1' })).rejects.toThrow(NotFoundError);
  });

  it('should throw BadRequestError when the plan is free', async () => {
    planRepository.findById.mockResolvedValue(makePlan({ price: 0 }));

    await expect(sut.execute({ planId: 'plan-1' })).rejects.toThrow(BadRequestError);
    expect(stripeService.createSetupIntent).not.toHaveBeenCalled();
  });

  it('should create a SetupIntent for a paid plan and return its client secret', async () => {
    const output = await sut.execute({ planId: 'plan-1', email: 'admin@padaria.com' });

    expect(stripeService.createSetupIntent).toHaveBeenCalledWith({
      customerEmail: 'admin@padaria.com',
    });
    expect(output).toEqual({ clientSecret: 'seti_secret_123', setupIntentId: 'seti_123' });
  });
});
