import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { Transactional } from 'typeorm-transactional';
import {
  TypeOperationStock,
  TypeProduct,
  TypeUnitOfMeasurement,
} from '@/shared/infra/enums/product';
import {
  TypeStockMovement,
  TypeStockMovementReason,
} from '@/shared/infra/enums/stock-movement';
import { ProductRepository } from '@/core/product/domain/repositories/product.repository';
import { UpdateStockProductUseCase } from '@/core/product/application/usecase/increase-decrease-stock-product.usecase';
import { ProductRecipeCostCalculator } from '@/core/product/application/services/product-recipe-cost-calculator.service';
import { StockMovementRepository } from '../../domain/repositories/stock-movement.repository';
import { StockMovement } from '../../domain/entities/stock-movement.entity';

type Input = {
  productId: string;
  quantity: number;
  type: TypeStockMovement;
  reason: TypeStockMovementReason;
  reasonDescription?: string | null;
};

type Output = {
  productId: string;
  totalCost: number;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

// Substitui CreateBatchUseCase (ENTRY) e WriteOffBatchUseCase (EXIT): ajusta
// o estoque do produto direto (sem lote/FEFO/validade) e registra o
// movimento pra histórico/relatórios. O ajuste de estoque em si (bloqueio
// por saldo insuficiente incluso) fica por conta de UpdateStockProductUseCase,
// que já é no-op para produtos sem `stockManagement` — o movimento, porém,
// é sempre registrado (mesmo sem controle de estoque), pra manter o custo de
// matéria-prima consumida/desperdiçada rastreável nos relatórios.
export class AdjustProductStockUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.STOCK_MOVEMENT_REPOSITORY)
    private readonly stockMovementRepository: StockMovementRepository,
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
    // preenchido pra matéria-prima (mesma lógica já usada no custo de receita).
    const isRawMaterial =
      product.typeProduct === TypeProduct.RAW_MATERIAL ||
      product.typeProduct === TypeProduct.RAW_MATERIAL_AND_RESALE;

    const costBasis = isRawMaterial
      ? ProductRecipeCostCalculator.getCostPerConsumerUnit(product)
      : product.unitOfMeasurement === TypeUnitOfMeasurement.KG
        ? (product.pricePerKilogram ?? 0)
        : product.unitCostPrice;

    await this.updateStockProductUseCase.execute({
      productId: product.id,
      type:
        input.type === TypeStockMovement.ENTRY
          ? TypeOperationStock.INCREASE
          : TypeOperationStock.DECREASE,
      value: input.quantity,
    });

    await this.stockMovementRepository.save(
      StockMovement.create({
        productId: product.id,
        type: input.type,
        quantity: input.quantity,
        reason: input.reason,
        reasonDescription: input.reasonDescription ?? null,
        unitCostSnapshot: costBasis,
        createdBy: loggedUser.id,
      }),
    );

    return {
      productId: product.id,
      totalCost: round2(input.quantity * costBasis),
    };
  }
}
