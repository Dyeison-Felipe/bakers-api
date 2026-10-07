import { Inject } from '@nestjs/common';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { RegisterManualStockMovementOutput } from '@/shared/application/output/stock-movement/register-manual-stock-movement.output';
import { Transactional } from 'typeorm-transactional';
import {
  TypeStockMovement,
  TypeStockMovementReason,
} from '@/shared/infra/enums/stock-movement';
import { ProductRepository } from '@/core/product/domain/repositories/product.repository';
import { AdjustProductStockUseCase } from './adjust-product-stock.usecase';

type Input = {
  productId: string;
  type: TypeStockMovement;
  quantity: number;
  reasonDescription?: string | null;
};

type Output = RegisterManualStockMovementOutput;

/**
 * Botão "Movimentar estoque" da tela de Estoque: entrada ou baixa manual
 * (compra, inventário, correção de saldo). Diferente dos fluxos automáticos
 * (produção, venda, desperdício), aqui o produto PRECISA ter "Controle de
 * estoque" ativado — sem ele, `UpdateStockProductUseCase` ignora o ajuste e
 * só ficaria um movimento no histórico sem efeito nenhum no saldo.
 * Saldo insuficiente na baixa é barrado pelo próprio ajuste de estoque.
 */
export class RegisterManualStockMovementUseCase
  implements UseCase<Input, Output>
{
  constructor(
    @Inject(PROVIDERS.PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
    private readonly adjustProductStockUseCase: AdjustProductStockUseCase,
  ) {}

  @Transactional()
  async execute(input: Input): Promise<Output> {
    const company = this.loggedUserService.getLoggedUser().company;

    const product = await this.productRepository.findProductByIdAndCompanyId(
      input.productId,
      company.id,
    );

    if (!product) {
      throw new NotFoundError('Produto não encontrado');
    }

    if (!product.stockManagement) {
      throw new BadRequestError(
        `Controle de estoque desativado para o produto ${product.name}`,
      );
    }

    await this.adjustProductStockUseCase.execute({
      productId: product.id,
      quantity: input.quantity,
      type: input.type,
      reason: TypeStockMovementReason.MANUAL_ADJUSTMENT,
      reasonDescription: input.reasonDescription?.trim() || null,
    });

    const updated = await this.productRepository.findProductByIdAndCompanyId(
      product.id,
      company.id,
    );

    return {
      productId: product.id,
      currentStock: updated?.currentStock ?? 0,
    };
  }
}
