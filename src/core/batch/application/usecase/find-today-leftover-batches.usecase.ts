import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { FindTodayLeftoverBatchesOutput } from '@/shared/application/output/batch/find-today-leftover-batches.output';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { BatchRepository } from '../../domain/repositories/batch.repository';

type Input = void;
type Output = FindTodayLeftoverBatchesOutput;

const round2 = (value: number) => Math.round(value * 100) / 100;

export class FindTodayLeftoverBatchesUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.BATCH_REPOSITORY)
    private readonly batchRepository: BatchRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const companyId = loggedUser.company.id;

    const today = new Date();

    const batches = await this.batchRepository.findAllByCompanyId(
      companyId,
      { onlyAvailable: true, producedOn: today },
      { limit: 500 },
    );

    const items = batches.items.map((batch) => {
      const isWeightBased = batch.unitOfMeasurement === TypeUnitOfMeasurement.KG;
      const costBasis = isWeightBased
        ? (batch.product!.pricePerKilogram ?? 0)
        : batch.product!.unitCostPrice;

      return {
        batchId: batch.id,
        product: {
          id: batch.product!.id,
          name: batch.product!.name,
        },
        unitOfMeasurement: batch.unitOfMeasurement,
        producedQuantity: batch.quantity,
        remainingQuantity: batch.remainingQuantity,
        potentialLossValue: round2(batch.remainingQuantity * costBasis),
      };
    });

    return {
      items,
      totalPotentialLoss: round2(
        items.reduce((sum, item) => sum + item.potentialLossValue, 0),
      ),
    };
  }
}
