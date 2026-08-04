import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { AddDailyProductionItemOutput } from '@/shared/application/output/daily-production/add-daily-production-item.output';
import { TypeProduct, TypeUnitOfMeasurement } from '@/shared/infra/enums/product';
import { TypeDailyProductionStatus } from '@/shared/infra/enums/daily-production';
import { Transactional } from 'typeorm-transactional';
import { ProductRepository } from '@/core/product/domain/repositories/product.repository';
import { DailyProductionRepository } from '../../domain/repositories/daily-production.repository';
import { DailyProductionItemRepository } from '../../domain/repositories/daily-production-item.repository';
import { DailyProductionItem } from '../../domain/entities/daily-production-item.entity';
import { DailyProductionItemCostCalculator } from '../services/daily-production-item-cost-calculator.service';

type Input = {
  dailyProductionId: string;
  productId: string;
  plannedQuantity?: number;
  recipeMultiplier?: number;
};

type Output = AddDailyProductionItemOutput;

export class AddDailyProductionItemUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.DAILY_PRODUCTION_REPOSITORY)
    private readonly dailyProductionRepository: DailyProductionRepository,
    @Inject(PROVIDERS.DAILY_PRODUCTION_ITEM_REPOSITORY)
    private readonly dailyProductionItemRepository: DailyProductionItemRepository,
    @Inject(PROVIDERS.PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  @Transactional()
  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const company = loggedUser.company;

    const dailyProduction = await this.dailyProductionRepository.findByIdAndCompanyId(
      input.dailyProductionId,
      company.id,
    );

    if (!dailyProduction) {
      throw new NotFoundError('Produção diária não encontrada');
    }

    if (dailyProduction.status !== TypeDailyProductionStatus.OPEN) {
      throw new BadRequestError('Produção diária já está concluída');
    }

    const product = await this.productRepository.findProductByIdAndCompanyId(
      input.productId,
      company.id,
    );

    if (!product) {
      throw new NotFoundError('Produto não encontrado');
    }

    if (product.typeProduct !== TypeProduct.OWN_PRODUCTION) {
      throw new BadRequestError(
        `O produto ${product.name} não é de produção própria`,
      );
    }

    if (!product.unitOfMeasurement) {
      throw new BadRequestError(
        `O produto ${product.name} não possui unidade de medida cadastrada`,
      );
    }

    if (!product.stockManagement) {
      throw new BadRequestError(
        `O produto ${product.name} não possui gerenciamento de estoque habilitado. Habilite o controle de estoque no cadastro do produto para incluí-lo na produção diária`,
      );
    }

    const unitOfMeasurement = product.unitOfMeasurement;
    const isWeightBased = unitOfMeasurement === TypeUnitOfMeasurement.KG;

    const { plannedWeight, plannedCost } = DailyProductionItemCostCalculator.calculate({
      unitOfMeasurement,
      plannedQuantity: input.plannedQuantity ?? null,
      recipeMultiplier: input.recipeMultiplier ?? null,
      productWeight: product.weight,
      unitCostPrice: product.unitCostPrice,
      pricePerKilogram: product.pricePerKilogram,
    });

    const item = DailyProductionItem.create({
      dailyProduction,
      product,
      unitOfMeasurement,
      plannedQuantity: isWeightBased ? null : (input.plannedQuantity ?? null),
      recipeMultiplier: isWeightBased ? (input.recipeMultiplier ?? null) : null,
      plannedWeight,
      unitCostPriceSnapshot: product.unitCostPrice,
      pricePerKilogramSnapshot: product.pricePerKilogram,
      plannedCost,
      createdBy: loggedUser.id,
    });

    const saved = await this.dailyProductionItemRepository.save(item);

    return { id: saved.id };
  }
}
