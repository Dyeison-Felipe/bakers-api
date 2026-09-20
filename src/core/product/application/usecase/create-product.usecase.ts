import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject } from '@nestjs/common';
import { ProductRepository } from '../../domain/repositories/product.repository';
import {
  TypeConsumptionUnit,
  TypeProduct,
  TypeUnitOfMeasurement,
  TypeUnitOfPurchase,
} from '@/shared/infra/enums/product';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { ConflictError } from '@/shared/application/errors/conflict-error';
import { Product } from '../../domain/entities/product.entity';
import { CategoryRepository } from '@/core/category/domain/repositories/category.repository';
import { CreateProductOutput } from '@/shared/application/output/product/create-product.output';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { MulterFile } from '@/shared/application/storage/multer-file.type';
import { StorageService } from '@/shared/application/storage/storage.service';
import { ProductAdditionalCostRepository } from '../../domain/repositories/product-additional-cost.repository';
import { ProductAdditionalCost } from '../../domain/entities/product-additional-cost.entity';
import { AdditionalCostRepository } from '@/core/additional-cost/domain/repositories/additional-cost.repository';
import { AdditionalCost } from '@/core/additional-cost/domain/entities/additional-cost.entity';
import { Transactional } from 'typeorm-transactional';
import { ProductRecipeCostCalculator } from '../services/product-recipe-cost-calculator.service';
import { ProductUnitCostCalculator } from '../services/product-unit-cost-calculator.service';
import { ProductProfitCalculator } from '../services/product-proft-calculator.service';
import { RecipeRepository } from '@/core/recipe/domain/repositories/recipe.repository';
import { RecipeItemRepository } from '@/core/recipe/domain/repositories/recipe-item.repository';
import { Recipe } from '@/core/recipe/domain/entities/recipe.entity';
import { ProductRecipeLinkRepository } from '../../domain/repositories/product-recipe-link.repository';
import { ProductRecipeLink } from '../../domain/entities/product-recipe-link.entity';
import { AdjustProductStockUseCase } from '@/core/stock-movement/application/usecase/adjust-product-stock.usecase';
import {
  TypeStockMovement,
  TypeStockMovementReason,
} from '@/shared/infra/enums/stock-movement';

type AdditionalCostInput = {
  id: string;
  value: number;
};

type AdditionalCostUsage = {
  additionalCost: AdditionalCost;
  value: number;
};

type RecipeLinkInput = {
  id: string;
};

type Input = {
  name: string;
  scaleReference?: string;
  barCode?: string;
  ncm: string;
  costPrice: number;
  unitCostPrice: number;
  pricePerKilogram?: number;
  salePrice?: number;
  profitPrice?: number;
  unitOfMeasurement?: TypeUnitOfMeasurement;
  consumerUnit?: TypeConsumptionUnit;
  expirationDateInDays?: string;
  stockManagement: boolean;
  typeProduct: TypeProduct;
  currentStock?: number;
  stockMin?: number;
  active: boolean;
  description?: string;
  purchaseUnit?: TypeUnitOfPurchase;
  quantity?: number;
  weight?: number;
  volume?: number;
  category: string;
  image?: MulterFile;
  additionalCost?: AdditionalCostInput[];
  recipeLinks?: RecipeLinkInput[];
};

type Output = CreateProductOutput;

export class CreateProductUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
    @Inject(PROVIDERS.CATEGORY_REPOSITORY)
    private readonly categoryRepository: CategoryRepository,
    @Inject(PROVIDERS.STORAGE_SERVICE)
    private readonly storageService: StorageService,
    @Inject(PROVIDERS.PRODUCT_ADDITIONAL_COST_REPOSITORY)
    private readonly productAdditionalCostRepository: ProductAdditionalCostRepository,
    @Inject(PROVIDERS.ADDITIONAL_COST_REPOSITORY)
    private readonly additionalCostRepository: AdditionalCostRepository,
    @Inject(PROVIDERS.RECIPE_REPOSITORY)
    private readonly recipeRepository: RecipeRepository,
    @Inject(PROVIDERS.RECIPE_ITEM_REPOSITORY)
    private readonly recipeItemRepository: RecipeItemRepository,
    @Inject(PROVIDERS.PRODUCT_RECIPE_LINK_REPOSITORY)
    private readonly productRecipeLinkRepository: ProductRecipeLinkRepository,
    private readonly adjustProductStockUseCase: AdjustProductStockUseCase,
  ) {}

  @Transactional()
  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const company = loggedUser.company;

    const isOwnProduction = input.typeProduct === TypeProduct.OWN_PRODUCTION;
    const isResale = input.typeProduct === TypeProduct.RESALE;
    const requiresPricing = isOwnProduction || isResale;

    if (isOwnProduction && !input.expirationDateInDays) {
      throw new BadRequestError(
        'Informe a validade em dias para produtos de produção própria',
      );
    }

    const initialStock = input.currentStock ?? 0;

    // Matéria-prima não tem unidade de venda (`unitOfMeasurement`) — a unidade
    // dela é a de consumo (`consumerUnit`), então qualquer uma das duas serve.
    const hasStockUnit = !!(input.unitOfMeasurement || input.consumerUnit);

    if (input.stockManagement && initialStock > 0 && !hasStockUnit) {
      throw new BadRequestError(
        'Informe a unidade de medida para lançar o estoque inicial',
      );
    }

    const exisProduct =
      await this.productRepository.findProductByNameAndCompanyId(
        input.name,
        company.id,
      );

    if (exisProduct) {
      throw new ConflictError(`Produto ${input.name} já está cadastrado`);
    }

    if (input.barCode) {
      const existingBarCode =
        await this.productRepository.findProductByBarCodeAndCompanyId(
          input.barCode,
          company.id,
        );

      if (existingBarCode) {
        throw new ConflictError('Código de barras já está em uso');
      }
    }

    const category = await this.categoryRepository.findCategoryByIdAndCompanyId(
      input.category,
      company.id,
    );

    if (!category) {
      throw new NotFoundError(`Categoria não encontrada`);
    }

    // 1. Custo de receita — SOMENTE produção própria
    let costPrice = input.costPrice;
    let additionalCostsUsage: AdditionalCostUsage[] = [];
    let resolvedRecipes: Recipe[] = [];
    let recipesCost = 0;

    // 1.1 Custos adicionais — SOMENTE produção própria
    if (isOwnProduction && input.additionalCost) {
      additionalCostsUsage = await this.resolveAdditionalCostsUsage(
        input.additionalCost,
        company.id,
      );
    }

    // 1.2 Receitas — SOMENTE produção própria
    if (isOwnProduction && input.recipeLinks?.length) {
      resolvedRecipes = await this.resolveRecipeLinks(
        input.recipeLinks,
        company.id,
      );
      recipesCost = await this.calculateRecipesCost(resolvedRecipes);
    }

    if (additionalCostsUsage.length || resolvedRecipes.length) {
      const additionalCostsTotal = additionalCostsUsage.reduce(
        (sum, usage) => sum + usage.value,
        0,
      );

      costPrice = additionalCostsTotal + recipesCost;
    }

    // 2. Custo unitário / por kg — matéria-prima E produção própria
    const { unitCostPrice, pricePerKilogram } =
      ProductUnitCostCalculator.calculate({
        typeProduct: input.typeProduct,
        costPrice,
        quantity: input.quantity ?? null,
        weight: input.weight ?? null,
        volume: input.volume ?? null,
        consumerUnit: input.consumerUnit ?? null,
        unitOfMeasurement: input.unitOfMeasurement ?? null,
      });

    // 3. Preço de venda / lucro — produção própria E revenda
    let salePrice: number | null = null;
    let profitPrice: number | null = null;

    if (requiresPricing && input.salePrice != null) {
      salePrice = input.salePrice;

      const basis = ProductProfitCalculator.getPricingBasis(
        input.unitOfMeasurement ?? null,
        unitCostPrice,
        pricePerKilogram,
      );

      profitPrice = ProductProfitCalculator.calculateProfit(salePrice, basis);
    }

    const imagePath = input.image?.buffer
      ? await this.storageService.upload(company.id, 'product', input.image)
      : null;

    const newProduct = Product.create({
      name: input.name,
      active: input.active,
      barCode: input.barCode ?? null,
      costPrice,
      unitCostPrice: unitCostPrice ?? input.unitCostPrice,
      pricePerKilogram: pricePerKilogram ?? input.pricePerKilogram ?? null,
      description: input.description ?? null,
      expirationDateInDays: input.expirationDateInDays ?? null,
      ncm: input.ncm,
      typeProduct: input.typeProduct,
      profitPrice: requiresPricing ? (profitPrice ?? 1) : null,
      salePrice: requiresPricing ? salePrice : null,
      scaleReference: input.scaleReference ?? null,
      // Nasce sem estoque: se houver estoque inicial, ele é lançado logo abaixo
      // via `AdjustProductStockUseCase`, que também registra o movimento de
      // entrada — nunca setado direto aqui, pra manter o histórico consistente.
      stockAtual: null,
      stockMin: input.stockMin ?? null,
      stockManagement:
        input.unitOfMeasurement === TypeUnitOfMeasurement.KG
          ? false
          : input.stockManagement,
      unitOfMeasurement: input.unitOfMeasurement ?? null,
      consumerUnit: input.consumerUnit ?? null,
      purchaseUnit: input.purchaseUnit ?? null,
      quantity: input.quantity ?? null,
      weight: input.weight ?? null,
      volume: input.volume ?? null,
      imagePath,
      createdBy: loggedUser.id,
      category: category,
      company: company,
      updatedBy: loggedUser.id,
    });

    const saveProduct = await this.productRepository.save(newProduct);

    if (input.stockManagement && initialStock > 0 && hasStockUnit) {
      await this.adjustProductStockUseCase.execute({
        productId: saveProduct.id,
        quantity: initialStock,
        type: TypeStockMovement.ENTRY,
        reason: TypeStockMovementReason.PRODUCTION,
      });
    }

    if (isOwnProduction && additionalCostsUsage.length) {
      await this.saveAdditionalCosts(saveProduct, additionalCostsUsage);
    }

    if (isOwnProduction && resolvedRecipes.length) {
      await this.saveRecipeLinks(saveProduct, resolvedRecipes);
    }

    return { id: saveProduct.id };
  }

  private async resolveRecipeLinks(
    recipeLinks: RecipeLinkInput[],
    companyId: string,
  ): Promise<Recipe[]> {
    const recipeIds = recipeLinks.map((r) => r.id);

    const recipes = await this.recipeRepository.findAllByIdsAndCompanyId(
      recipeIds,
      companyId,
    );
    const recipesMap = new Map(recipes.map((r) => [r.id, r]));

    const missing = recipeIds.filter((id) => !recipesMap.has(id));
    if (missing.length) {
      throw new NotFoundError(`Receita(s) não encontrada(s): ${missing.join(', ')}`);
    }

    return recipeIds.map((id) => recipesMap.get(id)!);
  }

  private async calculateRecipesCost(recipes: Recipe[]): Promise<number> {
    const items = await this.recipeItemRepository.findAllByRecipeIds(
      recipes.map((r) => r.id),
    );

    return ProductRecipeCostCalculator.calculateTotalCost(
      items.map((item) => ({ material: item.material, quantity: item.quantity })),
    );
  }

  private async saveRecipeLinks(
    product: Product,
    recipes: Recipe[],
  ): Promise<void> {
    await Promise.all(
      recipes.map((recipe) =>
        this.productRecipeLinkRepository.save(
          ProductRecipeLink.create({ product, recipe }),
        ),
      ),
    );
  }

  private async resolveAdditionalCostsUsage(
    additionalCosts: AdditionalCostInput[],
    companyId: string,
  ): Promise<AdditionalCostUsage[]> {
    if (!additionalCosts.length) {
      return [];
    }

    const additionalCostIds = additionalCosts.map((ac) => ac.id);

    const foundAdditionalCosts =
      await this.additionalCostRepository.findAllByIdsAndCompanyId(
        additionalCostIds,
        companyId,
      );

    const additionalCostsMap = new Map(
      foundAdditionalCosts.map((ac) => [ac.id, ac]),
    );

    const missing = additionalCostIds.filter(
      (id) => !additionalCostsMap.has(id),
    );
    if (missing.length) {
      throw new NotFoundError(
        `Custo(s) adicional(is) não encontrado(s): ${missing.join(', ')}`,
      );
    }

    return additionalCosts.map((ac) => ({
      additionalCost: additionalCostsMap.get(ac.id)!,
      value: ac.value,
    }));
  }

  private async saveAdditionalCosts(
    product: Product,
    additionalCostsUsage: AdditionalCostUsage[],
  ): Promise<void> {
    const productAdditionalCosts = additionalCostsUsage.map((usage) =>
      ProductAdditionalCost.create({
        product,
        additionalCost: usage.additionalCost,
        value: usage.value,
      }),
    );

    await Promise.all(
      productAdditionalCosts.map((item) =>
        this.productAdditionalCostRepository.save(item),
      ),
    );
  }
}
