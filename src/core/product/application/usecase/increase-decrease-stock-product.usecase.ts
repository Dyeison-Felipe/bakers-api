import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject } from '@nestjs/common';
import { ProductRepository } from '../../domain/repositories/product.repository';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { Product } from '../../domain/entities/product.entity';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { TypeOperationStock } from '@/shared/infra/enums/product-stock.enum';

type Input = {
  productId: string;
  type: TypeOperationStock;
  value: number;
};

type Output = {
  id: string;
};

export class UpdateStockProductUseCase implements UseCase<
  Input,
  Output
> {
  constructor(
    @Inject(PROVIDERS.PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const product = await this.productRepository.findProductByIdAndCompanyId(
      input.productId,
      loggedUser.company.id,
    );

    if (!product) {
      throw new NotFoundError(`Produto não encontrado`);
    }

    if (!product.stockManagement) {
      throw new BadRequestError(
        `O produto ${product.name} não possui gerencimanto de estoque`,
      );
    }

    if (!product.currentStock) {
      throw new BadRequestError(`O produto ${product.name} não possui estoque`);
    }

    const newCurrentStock =
      input.type === TypeOperationStock.INCREASE
        ? this.increase(product.currentStock, input.value)
        : this.decrease(product.currentStock, input.value, product.name);

    product.updateStock({
      currentStock: newCurrentStock,
      updatedBy: loggedUser.id,
    });

    await this.productRepository.update(product);

    return { id: product.id };
  }

  private increase(currentStock: number, increase: number): number {
    const newCurrentStock = currentStock + increase;

    return newCurrentStock;
  }

  private decrease(
    currentStock: number,
    decrease: number,
    productName: string,
  ): number {
    if (decrease > currentStock) {
      throw new BadRequestError(
        `Estoque insuficiente para o produto ${productName}. Estoque atual: ${currentStock}, quantidade solicitada: ${decrease}`,
      );
    }

    return currentStock - decrease;
  }
}
