import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { PaginationOutput } from '@/shared/application/output/pagination/pagination.output';
import { FindAllBatchesOutput } from '@/shared/application/output/batch/find-all-batches.output';
import { BatchRepository } from '../../domain/repositories/batch.repository';

type Input = {
  productId?: string;
  productName?: string;
  onlyAvailable?: boolean;
  page?: number;
  limit?: number;
};

type Output = PaginationOutput<FindAllBatchesOutput>;

export class FindAllBatchesUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.BATCH_REPOSITORY)
    private readonly batchRepository: BatchRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const batches = await this.batchRepository.findAllByCompanyId(
      loggedUser.company.id,
      {
        productId: input.productId,
        productName: input.productName,
        onlyAvailable: input.onlyAvailable,
      },
      {
        page: input.page,
        limit: input.limit,
      },
    );

    return {
      items: batches.items.map((batch) => ({
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
      })),
      meta: batches.meta,
    };
  }
}
