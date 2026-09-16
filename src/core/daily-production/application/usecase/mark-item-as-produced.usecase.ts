import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { MarkItemAsProducedOutput } from '@/shared/application/output/daily-production/mark-item-as-produced.output';
import { TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import {
  TypeDailyProductionItemStatus,
} from '@/shared/infra/enums/daily-production';
import { Transactional } from 'typeorm-transactional';
import { AdjustProductStockUseCase } from '@/core/stock-movement/application/usecase/adjust-product-stock.usecase';
import {
  TypeStockMovement,
  TypeStockMovementReason,
} from '@/shared/infra/enums/stock-movement';
import { Product } from '@/core/product/domain/entities/product.entity';
import { ProductRecipeLinkRepository } from '@/core/product/domain/repositories/product-recipe-link.repository';
import { RecipeItemRepository } from '@/core/recipe/domain/repositories/recipe-item.repository';
import { DailyProductionRepository } from '../../domain/repositories/daily-production.repository';
import { DailyProductionItemRepository } from '../../domain/repositories/daily-production-item.repository';
import { DailyProductionItem } from '../../domain/entities/daily-production-item.entity';

type Input = {
  id: string;
};

type Output = MarkItemAsProducedOutput;

const round3 = (value: number) => Math.round(value * 1000) / 1000;

export class MarkDailyProductionItemAsProducedUseCase
  implements UseCase<Input, Output>
{
  constructor(
    @Inject(PROVIDERS.DAILY_PRODUCTION_REPOSITORY)
    private readonly dailyProductionRepository: DailyProductionRepository,
    @Inject(PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY)
    private readonly dailyProductionItemRepository: DailyProductionItemRepository,
    @Inject(PROVIDERS.PRODUCT_RECIPE_LINK_REPOSITORY)
    private readonly productRecipeLinkRepository: ProductRecipeLinkRepository,
    @Inject(PROVIDERS.RECIPE_ITEM_REPOSITORY)
    private readonly recipeItemRepository: RecipeItemRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
    private readonly adjustProductStockUseCase: AdjustProductStockUseCase,
  ) {}

  @Transactional()
  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const item = await this.dailyProductionItemRepository.findByIdWithDailyProduction(
      input.id,
    );

    if (!item || item.dailyProduction?.company?.id !== loggedUser.company.id) {
      throw new NotFoundError('Item de produção não encontrado');
    }

    if (item.status !== TypeDailyProductionItemStatus.PLANNED) {
      throw new BadRequestError('Item já foi produzido');
    }

    let actualQuantity: number | null = null;
    let actualWeight: number | null = null;
    let quantityProduced: number;

    if (item.unitOfMeasurement === TypeUnitOfMeasurement.KG) {
      actualWeight = item.plannedWeight!;
      quantityProduced = item.plannedWeight!;
    } else {
      actualQuantity = item.plannedQuantity!;
      quantityProduced = item.plannedQuantity!;
    }

    await this.consumeRecipeMaterials(item, quantityProduced);

    await this.adjustProductStockUseCase.execute({
      productId: item.product!.id,
      quantity: quantityProduced,
      type: TypeStockMovement.ENTRY,
      reason: TypeStockMovementReason.PRODUCTION,
    });

    item.markAsProduced({
      actualQuantity,
      actualWeight,
      producedBy: loggedUser.id,
    });

    await this.dailyProductionItemRepository.update(item);

    await this.completeDailyProductionIfNeeded(item.dailyProduction!.id, loggedUser.id);

    return { id: item.id };
  }

  // Dá baixa nos insumos da receita vinculada ao produto produzido, na mesma
  // proporção calculada em FindDailyProductionItemRequirementsUseCase (soma
  // das quantidades entre receitas, escalada pelo multiplicador real
  // produzido). Só afeta o saldo de insumos com "Controle de estoque"
  // ativado — mesmo critério usado em FinalizeSaleUseCase para vendas; os
  // demais nunca tiveram saldo controlado, então não faz sentido baixar.
  private async consumeRecipeMaterials(
    item: DailyProductionItem,
    quantityProduced: number,
  ): Promise<void> {
    const isWeightBased = item.unitOfMeasurement === TypeUnitOfMeasurement.KG;
    const productQuantity = item.product!.quantity;

    const multiplier = isWeightBased
      ? (item.recipeMultiplier ?? 0)
      : productQuantity
        ? quantityProduced / productQuantity
        : 0;

    if (!multiplier) return;

    const recipeLinks = await this.productRecipeLinkRepository.findAllByProductId(
      item.product!.id,
    );

    if (!recipeLinks.length) return;

    const recipeItems = await this.recipeItemRepository.findAllByRecipeIds(
      recipeLinks.map((link) => link.recipe.id),
    );

    const requiredByMaterial = new Map<
      string,
      { material: Product; quantity: number }
    >();

    for (const recipeItem of recipeItems) {
      const current = requiredByMaterial.get(recipeItem.material.id);

      if (current) {
        current.quantity += recipeItem.quantity;
      } else {
        requiredByMaterial.set(recipeItem.material.id, {
          material: recipeItem.material,
          quantity: recipeItem.quantity,
        });
      }
    }

    for (const { material, quantity } of requiredByMaterial.values()) {
      if (!material.stockManagement) continue;

      await this.adjustProductStockUseCase.execute({
        productId: material.id,
        quantity: round3(quantity * multiplier),
        type: TypeStockMovement.EXIT,
        reason: TypeStockMovementReason.PRODUCTION,
      });
    }
  }

  private async completeDailyProductionIfNeeded(
    dailyProductionId: string,
    updatedBy: string,
  ): Promise<void> {
    const items = await this.dailyProductionItemRepository.findAllByDailyProductionId(
      dailyProductionId,
    );

    const hasPlannedItems = items.some(
      (item) => item.status === TypeDailyProductionItemStatus.PLANNED,
    );
    const hasProducedItems = items.some(
      (item) => item.status === TypeDailyProductionItemStatus.PRODUCED,
    );

    if (hasPlannedItems || !hasProducedItems) {
      return;
    }

    const dailyProduction =
      await this.dailyProductionRepository.findById(dailyProductionId);

    if (!dailyProduction) return;

    dailyProduction.complete(updatedBy);

    await this.dailyProductionRepository.update(dailyProduction);
  }
}
