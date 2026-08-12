import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { BatchMovementRepository } from '@/core/batch/domain/repositories/batch-movement.repository';
import { TypeBatchMovementReason } from '@/shared/infra/enums/batch';
import { TopWastedProductsOutput } from '@/shared/application/output/report/top-wasted-products.output';

type Input = {
  dateFrom: Date;
  dateTo: Date;
  limit?: number;
};

type Output = TopWastedProductsOutput;

const round2 = (value: number) => Math.round(value * 100) / 100;
const DEFAULT_LIMIT = 5;

export class FindTopWastedProductsUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.BATCH_MOVEMENT_REPOSITORY)
    private readonly batchMovementRepository: BatchMovementRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute({ dateFrom, dateTo, limit }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const companyId = loggedUser.company.id;

    const rows = await this.batchMovementRepository.findAllByCompanyAndDateAndReason(
      companyId,
      dateFrom,
      dateTo,
      [TypeBatchMovementReason.WASTE, TypeBatchMovementReason.MANUAL_DISCARD],
    );

    const byProductMap = new Map<
      string,
      { productName: string; quantity: number; totalCost: number }
    >();
    for (const row of rows) {
      const current = byProductMap.get(row.productId) ?? {
        productName: row.productName,
        quantity: 0,
        totalCost: 0,
      };
      current.quantity = round2(current.quantity + row.quantity);
      current.totalCost = round2(current.totalCost + row.totalCost);
      byProductMap.set(row.productId, current);
    }

    return Array.from(byProductMap.entries())
      .map(([productId, data]) => ({ productId, ...data }))
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, limit ?? DEFAULT_LIMIT);
  }
}
