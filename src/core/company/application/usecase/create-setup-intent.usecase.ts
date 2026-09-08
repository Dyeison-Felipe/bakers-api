import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject } from '@nestjs/common';
import { PlanRepository } from '@/core/plan/domain/repositories/plan.repository';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { StripeService } from '@/shared/application/stripe/stripe.service';

type Input = {
  planId: string;
  email?: string;
};

type Output = {
  clientSecret: string;
  setupIntentId: string;
};

// Cria um SetupIntent avulso, sem tocar a empresa ainda (nenhum registro é
// persistido aqui) — é só o que dá ao Payment Element do frontend um
// clientSecret pra tokenizar/confirmar o cartão do usuário ANTES do
// cadastro em si (POST /v1/company), igual o SDK.js do Mercado Pago fazia
// no fluxo antigo.
export class CreateSetupIntentUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.PLAN_REPOSITORY)
    private readonly planRepository: PlanRepository,
    @Inject(PROVIDERS.STRIPE_SERVICE)
    private readonly stripeService: StripeService,
  ) {}

  async execute(input: Input): Promise<Output> {
    const plan = await this.planRepository.findById(input.planId);

    if (!plan) {
      throw new NotFoundError(`Plano não encontrado`);
    }

    if (plan.price === 0) {
      throw new BadRequestError(`Este plano não exige pagamento`);
    }

    return this.stripeService.createSetupIntent({ customerEmail: input.email });
  }
}
