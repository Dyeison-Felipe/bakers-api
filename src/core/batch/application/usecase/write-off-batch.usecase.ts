import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { WriteOffBatchOutput } from '@/shared/application/output/batch/write-off-batch.output';
import { TypeOperationStock, TypeProduct, TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { TypeBatchMovement, TypeBatchMovementReason } from '@/shared/infra/enums/batch';
import { Transactional } from 'typeorm-transactional';
import { ProductRepository } from '@/core/product/domain/repositories/product.repository';
import { UpdateStockProductUseCase } from '@/core/product/application/usecase/increase-decrease-stock-product.usecase';
import { ProductRecipeCostCalculator } from '@/core/product/application/services/product-recipe-cost-calculator.service';
import { BatchRepository } from '../../domain/repositories/batch.repository';
import { BatchMovementRepository } from '../../domain/repositories/batch-movement.repository';
import { BatchMovement } from '../../domain/entities/batch-movement.entity';
import { FefoAllocatorService } from '../services/fefo-allocator.service';

type Input = {
  productId: string;
  quantity: number;
  reason: TypeBatchMovementReason;
  reasonDescription?: string | null;
};

type Output = WriteOffBatchOutput;

export class WriteOffBatchUseCase implements UseCase<Input, Output> {
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

    // Matéria-prima usa `consumerUnit` (un/kg/ml) pra decidir o custo, não
    // `unitOfMeasurement` — esse campo é da unidade de VENDA e nunca é
    // preenchido pra matéria-prima, então "un vs kg" aqui é só pra produção
    // própria/revenda (mesma lógica já usada no custo de receita).
    const isRawMaterial =
      product.typeProduct === TypeProduct.RAW_MATERIAL ||
      product.typeProduct === TypeProduct.RAW_MATERIAL_AND_RESALE;

    const costBasis = isRawMaterial
      ? ProductRecipeCostCalculator.getCostPerConsumerUnit(product)
      : product.unitOfMeasurement === TypeUnitOfMeasurement.KG
        ? (product.pricePerKilogram ?? 0)
        : product.unitCostPrice;

    // Sem controle de estoque (tipicamente matéria-prima), não existe lote
    // nenhum pra alocar — a baixa só registra o custo, sem mexer em
    // lote/estoque (produção própria é a única categoria que efetivamente
    // rastreia estoque via lote).
    if (!product.stockManagement) {
      await this.batchMovementRepository.save(
        BatchMovement.create({
          batchId: null,
          productId: product.id,
          type: TypeBatchMovement.EXIT,
          quantity: input.quantity,
          reason: input.reason,
          reasonDescription: input.reasonDescription ?? null,
          unitCostSnapshot: costBasis,
          createdBy: loggedUser.id,
        }),
      );

      return {
        productId: product.id,
        totalWrittenOff: input.quantity,
        batchesAffected: 0,
      };
    }

    const availableBatches =
      await this.batchRepository.findAvailableByProductIdOrderByExpiration(
        input.productId,
        company.id,
      );

    const allocations = FefoAllocatorService.allocate(
      availableBatches.map((batch) => ({
        id: batch.id,
        remainingQuantity: batch.remainingQuantity,
      })),
      input.quantity,
    );

    const batchesById = new Map(
      availableBatches.map((batch) => [batch.id, batch]),
    );

    for (const allocation of allocations) {
      const batch = batchesById.get(allocation.batchId)!;

      batch.consume(allocation.quantityToTake, loggedUser.id);

      await this.batchRepository.update(batch);

      await this.batchMovementRepository.save(
        BatchMovement.create({
          batchId: batch.id,
          productId: product.id,
          type: TypeBatchMovement.EXIT,
          quantity: allocation.quantityToTake,
          reason: input.reason,
          reasonDescription: input.reasonDescription ?? null,
          unitCostSnapshot: costBasis,
          createdBy: loggedUser.id,
        }),
      );
    }

    await this.updateStockProductUseCase.execute({
      productId: product.id,
      type: TypeOperationStock.DECREASE,
      value: input.quantity,
    });

    return {
      productId: product.id,
      totalWrittenOff: input.quantity,
      batchesAffected: allocations.length,
    };
  }
}
