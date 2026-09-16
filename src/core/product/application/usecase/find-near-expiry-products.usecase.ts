import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NearExpiryProductOutput } from '@/shared/application/output/product/near-expiry-product.output';
import { StockMovementRepository } from '@/core/stock-movement/domain/repositories/stock-movement.repository';
import { ProductRepository } from '../../domain/repositories/product.repository';

type Input = void;
type Output = NearExpiryProductOutput[];

// Quantos dias faltando pra vencer (estimados) já disparam o alerta.
const DAYS_THRESHOLD = 2;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Não existe mais controle de validade por lote (removido de propósito, ver
// AdjustProductStockUseCase), então a validade é estimada a partir da última
// entrada de estoque do produto + `expirationDateInDays`. Produtos sem
// nenhuma entrada registrada são ignorados — não há como estimar.
export class FindNearExpiryProductsUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(PROVIDERS.STOCK_MOVEMENT_REPOSITORY)
    private readonly stockMovementRepository: StockMovementRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const products = await this.productRepository.findExpiringSoonByCompanyId(
      loggedUser.company.id,
    );

    if (!products.length) return [];

    const lastEntries = await this.stockMovementRepository.findLastEntryDateByProductIds(
      products.map((product) => product.id),
    );
    const lastEntryByProductId = new Map(
      lastEntries.map((entry) => [entry.productId, entry.lastEntryDate]),
    );

    const now = Date.now();
    const items: NearExpiryProductOutput[] = [];

    for (const product of products) {
      const lastEntryDate = lastEntryByProductId.get(product.id);
      const expirationDays = Number(product.expirationDateInDays);

      if (!lastEntryDate || !expirationDays) continue;

      const estimatedExpiryTime =
        new Date(lastEntryDate).getTime() + expirationDays * MS_PER_DAY;
      const daysUntilExpiry = Math.ceil((estimatedExpiryTime - now) / MS_PER_DAY);

      if (daysUntilExpiry > DAYS_THRESHOLD) continue;

      items.push({
        id: product.id,
        name: product.name,
        currentStock: product.currentStock,
        unitOfMeasurement: product.unitOfMeasurement,
        daysUntilExpiry,
      });
    }

    return items.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }
}
