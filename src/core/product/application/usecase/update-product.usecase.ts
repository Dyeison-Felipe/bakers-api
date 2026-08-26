import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject, NotFoundException } from '@nestjs/common';
import { ProductRepository } from '../../domain/repositories/product.repository';
import {
  TypeConsumptionUnit,
  TypeProduct,
  TypeUnitOfMeasurement,
  TypeUnitOfPurchase,
} from '@/shared/infra/enums/product';
import { CategoryRepository } from '@/core/category/domain/repositories/category.repository';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { MulterFile } from '@/shared/application/storage/multer-file.type';
import { StorageService } from '@/shared/application/storage/storage.service';
import { ProductRecipeItemRepository } from '../../domain/repositories/product-recipe-item.repository';
import { ProductRecipeItem } from '../../domain/entities/product-recipe-item.entity';
import { ProductAdditionalCostRepository } from '../../domain/repositories/product-additional-cost.repository';
import { ProductAdditionalCost } from '../../domain/entities/product-additional-cost.entity';
import { AdditionalCostRepository } from '@/core/additional-cost/domain/repositories/additional-cost.repository';
import { AdditionalCost } from '@/core/additional-cost/domain/entities/additional-cost.entity';
import { Transactional } from 'typeorm-transactional';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { ConflictError } from '@/shared/application/errors/conflict-error';
import {
  MaterialUsage,
  ProductRecipeCostCalculator,
} from '../services/product-recipe-cost-calculator.service';
import { ProductUnitCostCalculator } from '../services/product-unit-cost-calculator.service';
import { ProductProfitCalculator } from '../services/product-proft-calculator.service';
import { Product } from '../../domain/entities/product.entity';
import { RecipeRepository } from '@/core/recipe/domain/repositories/recipe.repository';
import { RecipeItemRepository } from '@/core/recipe/domain/repositories/recipe-item.repository';
import { ProductRecipeLinkRepository } from '../../domain/repositories/product-recipe-link.repository';
import { ProductRecipeLink } from '../../domain/entities/product-recipe-link.entity';

type ProductMaterialInput = {
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

type RecipeLinkInput = {
  id: string;
};

type Input = {
  id: string;
  name: string;
  scaleReference?: string;
  barCode?: string;
  ncm: string;
  costPrice: number;
  unitCostPrice: number;
  pricePerKilogram: number | null;
  typeProduct: TypeProduct;
  salePrice?: number;
  profitPrice?: number;
  unitOfMeasurement?: TypeUnitOfMeasurement;
  consumerUnit?: TypeConsumptionUnit;
  expirationDateInDays?: string;
  stockManagement: boolean;
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
  productMaterial?: ProductMaterialInput[];
  additionalCost?: AdditionalCostInput[];
  recipeLinks?: RecipeLinkInput[];
};

type Output = {
  id: string;
};

export class UpdateProductUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(PROVIDERS.CATEGORY_REPOSITORY)
    private readonly categoryRepository: CategoryRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
    @Inject(PROVIDERS.STORAGE_SERVICE)
    private readonly storageService: StorageService,
    @Inject(PROVIDERS.PRODUCT_RECIPE_ITEM)
    private readonly productRecipeItemRepository: ProductRecipeItemRepository,
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

    const product = await this.productRepository.findProductByIdAndCompanyId(
      input.id,
      company.id,
    );
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    const category = await this.categoryRepository.findCategoryByIdAndCompanyId(
      input.category,
      company.id,
    );
    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    if (input.barCode) {
      const existingBarCode =
        await this.productRepository.findProductByBarCodeAndCompanyId(
          input.barCode,
          company.id,
          product.id,
        );

      if (existingBarCode) {
        throw new ConflictError('Código de barras já está em uso');
      }
    }

    // 1. Diff + persistência dos recipe items e custos adicionais — SOMENTE produção própria
    let costPrice = input.costPrice;
    let materialsUsage: MaterialUsage[] = [];
    let additionalCostsUsage: AdditionalCostUsage[] = [];
    let recipesCost = 0;
    let hasRecipeLinks = false;

    if (isOwnProduction) {
      materialsUsage = await this.syncRecipeItems(
        product,
        input.productMaterial ?? [],
        company.id,
      );

      additionalCostsUsage = await this.syncAdditionalCosts(
        product,
        input.additionalCost ?? [],
        company.id,
      );

      recipesCost = await this.syncRecipeLinks(
        product,
        input.recipeLinks ?? [],
        company.id,
      );
      hasRecipeLinks = !!input.recipeLinks?.length;

      if (materialsUsage.length || additionalCostsUsage.length || hasRecipeLinks) {
        const materialsCost = materialsUsage.length
          ? ProductRecipeCostCalculator.calculateTotalCost(materialsUsage)
          : 0;

        const additionalCostsTotal = additionalCostsUsage.reduce(
          (sum, usage) => sum + usage.value,
          0,
        );

        costPrice = materialsCost + additionalCostsTotal + recipesCost;
      }
    } else {
      // Produto deixou de ser produção própria (ou nunca foi) —
      // garante que não sobra nenhum vínculo órfão.
      await this.deleteAllRecipeItems(product.id);
      await this.deleteAllAdditionalCosts(product.id);
      await this.deleteAllRecipeLinks(product.id);
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

    // Só troca a imagem se uma nova foi enviada
    let imagePath = product.imagePath;
    if (input.image?.buffer) {
      if (product.imagePath) {
        await this.storageService.delete(product.imagePath);
      }
      imagePath = await this.storageService.upload(
        company.id,
        'product',
        input.image,
      );
    }

    product.update({
      name: input.name,
      scaleReference: input.scaleReference ?? null,
      barCode: input.barCode ?? product.barCode,
      ncm: input.ncm,
      costPrice,
      salePrice: requiresPricing ? salePrice : null,
      profitPrice: requiresPricing ? (profitPrice ?? 1) : null,
      unitOfMeasurement: input.unitOfMeasurement ?? product.unitOfMeasurement,
      consumerUnit: input.consumerUnit ?? product.consumerUnit,
      expirationDateInDays:
        input.expirationDateInDays ?? product.expirationDateInDays,
      stockManagement:
        (input.unitOfMeasurement ?? product.unitOfMeasurement) ===
        TypeUnitOfMeasurement.KG
          ? false
          : input.stockManagement,
      typeProduct: input.typeProduct,
      pricePerKilogram: pricePerKilogram ?? input.pricePerKilogram,
      unitCostPrice: unitCostPrice ?? input.unitCostPrice,
      imagePath,
      // `currentStock` do request é ignorado de propósito: editar o produto não
      // pode mais alterar o estoque diretamente (isso desincroniza de `batch`,
      // que é quem a baixa por venda/produção realmente consulta). Ajustes de
      // estoque passam a ser feitos só pela tela de Lotes.
      stockAtual: product.currentStock,
      stockMin: input.stockMin ?? product.stockMin,
      active: input.active,
      description: input.description ?? product.description,
      purchaseUnit: input.purchaseUnit ?? product.purchaseUnit,
      quantity: input.quantity ?? null,
      weight: input.weight ?? null,
      volume: input.volume ?? null,
      updatedBy: loggedUser.id,
      category,
    });

    await this.productRepository.update(product);

    return { id: product.id };
  }

  /**
   * Faz o diff entre os recipe items já persistidos e o que veio no request:
   * - existe no banco mas não veio no request -> remove (usuário desmarcou)
   * - existe nos dois -> atualiza a quantidade (se mudou)
   * - só veio no request -> cria novo vínculo
   */
  private async syncRecipeItems(
    ownProduct: Product,
    productMaterial: ProductMaterialInput[],
    companyId: string,
  ): Promise<MaterialUsage[]> {
    const existingItems =
      await this.productRecipeItemRepository.findAllByProductId(ownProduct.id);

    const existingByMaterialId = new Map(
      existingItems.map((item) => [item.material.id, item]),
    );
    const incomingByMaterialId = new Map(
      productMaterial.map((item) => [item.id, item]),
    );

    const toRemove = existingItems.filter(
      (item) => !incomingByMaterialId.has(item.material.id),
    );
    await Promise.all(
      toRemove.map((item) =>
        this.productRecipeItemRepository.deleteById(item.id),
      ),
    );

    if (!productMaterial.length) {
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

    const materialsUsage: MaterialUsage[] = [];

    for (const incoming of productMaterial) {
      const material = materialsMap.get(incoming.id)!;
      const existing = existingByMaterialId.get(incoming.id);

      if (existing) {
        if (existing.quantity !== incoming.quantity) {
          existing.updateQuantity(incoming.quantity);
          await this.productRecipeItemRepository.save(existing);
        }
      } else {
        const newItem = ProductRecipeItem.create({
          product: ownProduct,
          material,
          quantity: incoming.quantity,
        });
        await this.productRecipeItemRepository.save(newItem);
      }

      materialsUsage.push({ material, quantity: incoming.quantity });
    }

    return materialsUsage;
  }

  private async deleteAllRecipeItems(productId: string): Promise<void> {
    const existingItems =
      await this.productRecipeItemRepository.findAllByProductId(productId);

    await Promise.all(
      existingItems.map((item) =>
        this.productRecipeItemRepository.deleteById(item.id),
      ),
    );
  }

  /**
   * Faz o diff dos vínculos com receitas-base reutilizáveis (só cria/remove,
   * não há "quantidade" nesse vínculo — quem tem quantidade é o item dentro
   * da própria receita). Recalcula o custo de TODAS as receitas vinculadas
   * a cada save, mesmo as que não mudaram, porque o preço das matérias-primas
   * de uma receita pode ter mudado desde o último save do produto.
   */
  private async syncRecipeLinks(
    ownProduct: Product,
    recipeLinks: RecipeLinkInput[],
    companyId: string,
  ): Promise<number> {
    const existingLinks =
      await this.productRecipeLinkRepository.findAllByProductId(
        ownProduct.id,
      );

    const existingByRecipeId = new Map(
      existingLinks.map((link) => [link.recipe.id, link]),
    );
    const incomingByRecipeId = new Map(recipeLinks.map((r) => [r.id, r]));

    const toRemove = existingLinks.filter(
      (link) => !incomingByRecipeId.has(link.recipe.id),
    );
    await Promise.all(
      toRemove.map((link) => this.productRecipeLinkRepository.delete(link.id)),
    );

    if (!recipeLinks.length) {
      return 0;
    }

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

    await Promise.all(
      recipeIds
        .filter((id) => !existingByRecipeId.has(id))
        .map((id) =>
          this.productRecipeLinkRepository.save(
            ProductRecipeLink.create({
              product: ownProduct,
              recipe: recipesMap.get(id)!,
            }),
          ),
        ),
    );

    const items = await this.recipeItemRepository.findAllByRecipeIds(recipeIds);

    return ProductRecipeCostCalculator.calculateTotalCost(
      items.map((item) => ({ material: item.material, quantity: item.quantity })),
    );
  }

  private async deleteAllRecipeLinks(productId: string): Promise<void> {
    const existingLinks =
      await this.productRecipeLinkRepository.findAllByProductId(productId);

    await Promise.all(
      existingLinks.map((link) =>
        this.productRecipeLinkRepository.delete(link.id),
      ),
    );
  }

  /**
   * Faz o mesmo diff para os custos adicionais:
   * - existe no banco mas não veio no request -> remove
   * - existe nos dois -> atualiza o valor (se mudou)
   * - só veio no request -> cria novo vínculo
   */
  private async syncAdditionalCosts(
    ownProduct: Product,
    additionalCosts: AdditionalCostInput[],
    companyId: string,
  ): Promise<AdditionalCostUsage[]> {
    const existingItems =
      await this.productAdditionalCostRepository.findAllByProductId(
        ownProduct.id,
      );

    const existingByAdditionalCostId = new Map(
      existingItems.map((item) => [item.additionalCost.id, item]),
    );
    const incomingByAdditionalCostId = new Map(
      additionalCosts.map((item) => [item.id, item]),
    );

    const toRemove = existingItems.filter(
      (item) => !incomingByAdditionalCostId.has(item.additionalCost.id),
    );
    await Promise.all(
      toRemove.map((item) =>
        this.productAdditionalCostRepository.delete(item.id),
      ),
    );

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

    const additionalCostsUsage: AdditionalCostUsage[] = [];

    for (const incoming of additionalCosts) {
      const additionalCost = additionalCostsMap.get(incoming.id)!;
      const existing = existingByAdditionalCostId.get(incoming.id);

      if (existing) {
        if (existing.value !== incoming.value) {
          existing.updateValue(incoming.value);
          await this.productAdditionalCostRepository.update(existing);
        }
      } else {
        const newItem = ProductAdditionalCost.create({
          product: ownProduct,
          additionalCost,
          value: incoming.value,
        });
        await this.productAdditionalCostRepository.save(newItem);
      }

      additionalCostsUsage.push({ additionalCost, value: incoming.value });
    }

    return additionalCostsUsage;
  }

  private async deleteAllAdditionalCosts(productId: string): Promise<void> {
    const existingItems =
      await this.productAdditionalCostRepository.findAllByProductId(
        productId,
      );

    await Promise.all(
      existingItems.map((item) =>
        this.productAdditionalCostRepository.delete(item.id),
      ),
    );
  }
}