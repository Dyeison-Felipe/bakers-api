import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { CreateBatchOutput } from '@/shared/application/output/batch/create-batch.output';
import { TypeOperationStock, TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import {
  TypeBatchMovement,
  TypeBatchMovementReason,
} from '@/shared/infra/enums/batch';
import { Transactional } from 'typeorm-transactional';
import { ProductRepository } from '@/core/product/domain/repositories/product.repository';
import { UpdateStockProductUseCase } from '@/core/product/application/usecase/increase-decrease-stock-product.usecase';
import { BatchRepository } from '../../domain/repositories/batch.repository';
import { BatchMovementRepository } from '../../domain/repositories/batch-movement.repository';
import { Batch } from '../../domain/entities/batch.entity';
import { BatchMovement } from '../../domain/entities/batch-movement.entity';

type Input = {
  productId: string;
  quantity: number;
  unitOfMeasurement: TypeUnitOfMeasurement;
  productionDate: Date;
  dailyProductionItemId?: string | null;
};

type Output = CreateBatchOutput;

export class CreateBatchUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.BATCH_REPOSITORY)
    private readonly batchRepository: BatchRepository,
    @Inject(PROVIDERS.BATCH_MOVEMENT_REPOSITORY)
    private readonly batchMovementRepository: BatchMovementRepository,
    @Inject(PROVIDERS.PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
    private readonly updateStockProductUseCase: UpdateStockProductUseCase,
  ) {}

  @Transactional()
  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const company = loggedUser.company;

    const product = await this.productRepository.findProductByIdAndCompanyId(
      input.productId,
      company.id,
    );

    if (!product) {
      throw new NotFoundError('Produto não encontrado');
    }

    const expirationDate = this.calculateExpirationDate(
      input.productionDate,
      product.expirationDateInDays,
    );

    const batch = Batch.create({
      product,
      company,
      dailyProductionItemId: input.dailyProductionItemId ?? null,
      quantity: input.quantity,
      unitOfMeasurement: input.unitOfMeasurement,
      productionDate: input.productionDate,
      expirationDate,
      createdBy: loggedUser.id,
    });

    const savedBatch = await this.batchRepository.save(batch);

    await this.batchMovementRepository.save(
      BatchMovement.create({
        batchId: savedBatch.id,
        type: TypeBatchMovement.ENTRY,
        quantity: input.quantity,
        reason: TypeBatchMovementReason.PRODUCTION,
        reasonDescription: null,
        createdBy: loggedUser.id,
      }),
    );

    await this.updateStockProductUseCase.execute({
      productId: product.id,
      type: TypeOperationStock.INCREASE,
      value: input.quantity,
    });

    return { id: savedBatch.id };
  }

  private calculateExpirationDate(
    productionDate: Date,
    expirationDateInDays: string | null,
  ): Date | null {
    const days = expirationDateInDays ? Number(expirationDateInDays) : NaN;

    if (!days || Number.isNaN(days) || days <= 0) {
      return null;
    }

    const expirationDate = new Date(productionDate);
    expirationDate.setDate(expirationDate.getDate() + days);

    return expirationDate;
  }
}
