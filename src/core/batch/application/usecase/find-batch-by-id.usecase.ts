import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BatchOutput } from '@/shared/application/output/batch/batch.output';
import { BatchRepository } from '../../domain/repositories/batch.repository';

type Input = {
  id: string;
};

type Output = BatchOutput;

export class FindBatchByIdUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.BATCH_REPOSITORY)
    private readonly batchRepository: BatchRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const batch = await this.batchRepository.findByIdAndCompanyId(
      input.id,
      loggedUser.company.id,
    );

    if (!batch) {
      throw new NotFoundError('Lote não encontrado');
    }

    return {
      id: batch.id,
      product: {
        id: batch.product!.id,
        name: batch.product!.name,
      },
      quantity: batch.quantity,
      remainingQuantity: batch.remainingQuantity,
      unitOfMeasurement: batch.unitOfMeasurement,
      productionDate: batch.productionDate,
      expirationDate: batch.expirationDate,
      dailyProductionItemId: batch.dailyProductionItemId,
      createdAt: batch.auditable!.createdAt,
    };
  }
}
