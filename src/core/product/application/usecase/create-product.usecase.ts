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
import { MulterFile } from '@/shared/application/storage/multer-file.type';
import { StorageService } from '@/shared/application/storage/storage.service';
import { ProductRecipeItemRepository } from '../../domain/repositories/product-recipe-item.repository';
import { ProductRecipeItem } from '../../domain/entities/product-recipe-item.entity';
import { ProductAdditionalCostRepository } from '../../domain/repositories/product-additional-cost.repository';
import { ProductAdditionalCost } from '../../domain/entities/product-additional-cost.entity';
import { AdditionalCostRepository } from '@/core/additional-cost/domain/repositories/additional-cost.repository';
import { AdditionalCost } from '@/core/additional-cost/domain/entities/additional-cost.entity';
import { Transactional } from 'typeorm-transactional';
import {
  MaterialUsage,
  ProductRecipeCostCalculator,
} from '../services/product-recipe-cost-calculator.service';
import { ProductUnitCostCalculator } from '../services/product-unit-cost-calculator.service';
import { ProductProfitCalculator } from '../services/product-proft-calculator.service';

type CostPriceProduct = {
  id: string;
  quantity: number;
};

type AdditionalCostInput = {
  id: string;
  value: number;
};

type AdditionalCostUsage = {
  additionalCost: AdditionalCost;
  value: number;
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
  productMaterial?: CostPriceProduct[];
  additionalcost?: AdditionalCostInput[];
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
    @Inject(PROVIDERS.PRODUCT_RECIPE_ITEM)
    private readonly productRecipeItemRepository: ProductRecipeItemRepository,
    @Inject(PROVIDERS.PRODUCT_ADDITIONAL_COST_REPOSITORY)
    private readonly productAdditionalCostRepository: ProductAdditionalCostRepository,
    @Inject(PROVIDERS.ADDITIONAL_COST_REPOSITORY)
    private readonly additionalCostRepository: AdditionalCostRepository,
  ) {}

  @Transactional()
  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();
    const company = loggedUser.company;

    const isOwnProduction = input.typeProduct === TypeProduct.OWN_PRODUCTION;

    const exisProduct =
      await this.productRepository.findProductByNameAndCompanyId(
        input.name,
        company.id,
      );

    if (exisProduct) {
      throw new ConflictError(`Produto ${input.name} já está cadastrado`);
    }

    const category = await this.categoryRepository.findCategoryByIdAndCompanyId(
      input.category,
      company.id,
    );

    if (!category) {
      throw new NotFoundError(`Categoria não encontrada`);
    }

    // 1. Custo de receita (matérias-primas) — SOMENTE produção própria
    let costPrice = input.costPrice;
    let materialsUsage: MaterialUsage[] = [];
    let additionalCostsUsage: AdditionalCostUsage[] = [];

    if (isOwnProduction && input.productMaterial) {
      materialsUsage = await this.resolveMaterialsUsage(
        input.productMaterial,
        company.id,
      );
    }

    // 1.1 Custos adicionais — SOMENTE produção própria
    if (isOwnProduction && input.additionalcost) {
      additionalCostsUsage = await this.resolveAdditionalCostsUsage(
        input.additionalcost,
        company.id,
      );
    }

    if (materialsUsage.length || additionalCostsUsage.length) {
      const materialsCost = materialsUsage.length
        ? ProductRecipeCostCalculator.calculateTotalCost(materialsUsage)
        : 0;

      const additionalCostsTotal = additionalCostsUsage.reduce(
        (sum, usage) => sum + usage.value,
        0,
      );

      costPrice = materialsCost + additionalCostsTotal;
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

    // 3. Preço de venda / lucro — SOMENTE produção própria
    let salePrice: number | null = null;
    let profitPrice: number | null = null;

    if (isOwnProduction && input.salePrice != null) {
      salePrice = input.salePrice;

      const basis = ProductProfitCalculator.getPricingBasis(
        input.unitOfMeasurement ?? null,
        unitCostPrice,
        pricePerKilogram,
      );

      profitPrice = ProductProfitCalculator.calculateProfit(salePrice, basis);
    }

    const imagePath = input.image?.buffer
      ? this.storageService.saveProductImage(company.id, input.image)
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
      profitPrice: isOwnProduction ? (profitPrice ?? 1) : null,
      salePrice: isOwnProduction ? salePrice : null,
      scaleReference: input.scaleReference ?? null,
      stockAtual: input.currentStock ?? null,
      stockMin: input.stockMin ?? null,
      stockManagement: input.stockManagement,
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

    if (isOwnProduction && materialsUsage.length) {
      await this.saveRecipeItems(saveProduct, materialsUsage);
    }

    if (isOwnProduction && additionalCostsUsage.length) {
      await this.saveAdditionalCosts(saveProduct, additionalCostsUsage);
    }

    return { id: saveProduct.id };
  }

  private async resolveMaterialsUsage(
    productMaterial: CostPriceProduct[],
    companyId: string,
  ): Promise<MaterialUsage[]> {
    if (!productMaterial?.length) {
      return [];
    }

    const materialIds = productMaterial.map((m) => m.id);

    const materials = await this.productRepository.findAllByIdsAndCompanyId(
      materialIds,
      companyId,
    );

    const materialsMap = new Map(materials.map((m) => [m.id, m]));

    const missing = materialIds.filter((id) => !materialsMap.has(id));
    if (missing.length) {
      throw new NotFoundError(
        `Matéria(s)-prima não encontrada(s): ${missing.join(', ')}`,
      );
    }

    return productMaterial.map((m) => ({
      material: materialsMap.get(m.id)!,
      quantity: m.quantity,
    }));
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

  private async saveRecipeItems(
    product: Product,
    materialsUsage: MaterialUsage[],
  ): Promise<void> {
    const recipeItems = materialsUsage.map((usage) =>
      ProductRecipeItem.create({
        product,
        material: usage.material,
        quantity: usage.quantity,
      }),
    );

    await Promise.all(
      recipeItems.map((item) => this.productRecipeItemRepository.save(item)),
    );
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