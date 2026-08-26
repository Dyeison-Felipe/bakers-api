import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { TypeBatchMovementReason } from '@/shared/infra/enums/batch';
import { FindWasteMovementsOutput } from '@/shared/application/output/batch/find-waste-movements.output';
import { BatchMovementRepository } from '../../domain/repositories/batch-movement.repository';

type Input = {
  dateFrom: Date;
  dateTo: Date;
};

type Output = FindWasteMovementsOutput;

export class FindWasteMovementsUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.BATCH_MOVEMENT_REPOSITORY)
    private readonly batchMovementRepository: BatchMovementRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute({ dateFrom, dateTo }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const companyId = loggedUser.company.id;

    const items = await this.batchMovementRepository.findAllByCompanyAndDateAndReason(
      companyId,
      dateFrom,
      dateTo,
      [TypeBatchMovementReason.WASTE, TypeBatchMovementReason.MANUAL_DISCARD],
    );

    return { items };
  }
}
