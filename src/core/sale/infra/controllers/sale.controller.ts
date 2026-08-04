import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { createReadStream } from 'fs';
import { FastifyReply } from 'fastify';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Permission } from '@/shared/infra/decorators/permission.decorator';
import { PermissionSale } from '@/core/auth/domain/permissions-definition/sale';
import { Pagination } from '@/shared/infra/presenter/pagination/pagination.presenter';
import { ProductForSalePresenter } from '@/shared/infra/presenter/sale/product-for-sale.presenter';
import { FinalizeSalePresenter } from '@/shared/infra/presenter/sale/finalize-sale.presenter';
import { SalePresenter } from '@/shared/infra/presenter/sale/sale.presenter';
import { FindAllSalesItemPresenter } from '@/shared/infra/presenter/sale/find-all-sales-item.presenter';
import { CreateSaleDto } from '../dtos/create-sale.dto';
import { FindProductsForSaleUseCase } from '../../application/usecase/find-products-for-sale.usecase';
import { FinalizeSaleUseCase } from '../../application/usecase/finalize-sale.usecase';
import { FindSaleByIdUseCase } from '../../application/usecase/find-sale-by-id.usecase';
import { FindAllSalesUseCase } from '../../application/usecase/find-all-sales.usecase';
import { GetSaleReceiptUseCase } from '../../application/usecase/get-sale-receipt.usecase';

@ApiTags('Sale')
@Controller('v1/sale')
export class SaleController {
  constructor(
    private readonly findProductsForSaleUseCase: FindProductsForSaleUseCase,
    private readonly finalizeSaleUseCase: FinalizeSaleUseCase,
    private readonly findSaleByIdUseCase: FindSaleByIdUseCase,
    private readonly findAllSalesUseCase: FindAllSalesUseCase,
    private readonly getSaleReceiptUseCase: GetSaleReceiptUseCase,
  ) {}

  @Get('eligible-products')
  @Permission(PermissionSale.SALE_CREATE)
  @ApiOperation({
    summary: 'Lista produtos elegíveis para venda no PDV',
    description:
      'Retorna produtos ativos de produção própria/revenda, com busca por nome ou código de barras.',
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiOkResponse({ type: ProductForSalePresenter, isArray: true })
  async eligibleProducts(
    @Query('search') search?: string,
    @Query('page') page?: string,
  ): Promise<Pagination<ProductForSalePresenter>> {
    return await this.findProductsForSaleUseCase.execute({
      search,
      page: page ? Number(page) : undefined,
    });
  }

  @Post()
  @Permission(PermissionSale.SALE_CREATE)
  @ApiOperation({
    summary: 'Finaliza uma venda',
    description:
      'Registra a venda, valida e dá baixa no estoque dos itens, calcula troco (se pagamento em dinheiro) e gera o cupom em PDF (se CPF informado).',
  })
  @ApiOkResponse({ type: FinalizeSalePresenter })
  @ApiUnauthorizedResponse({
    description: 'Usuário não autenticado ou sem permissão',
  })
  async create(@Body() dto: CreateSaleDto): Promise<FinalizeSalePresenter> {
    return await this.finalizeSaleUseCase.execute(dto);
  }

  @Get()
  @Permission(PermissionSale.SALE_READER)
  @ApiOperation({ summary: 'Lista o histórico de vendas' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'cashRegisterSessionId', required: false })
  @ApiOkResponse({ type: FindAllSalesItemPresenter, isArray: true })
  async findAll(
    @Query('page') page?: string,
    @Query('cashRegisterSessionId') cashRegisterSessionId?: string,
  ): Promise<Pagination<FindAllSalesItemPresenter>> {
    return await this.findAllSalesUseCase.execute({
      page: page ? Number(page) : undefined,
      cashRegisterSessionId,
    });
  }

  @Get(':id')
  @Permission(PermissionSale.SALE_READER)
  @ApiOperation({ summary: 'Busca uma venda pelo id, com os itens' })
  @ApiParam({ name: 'id', description: 'Id da venda' })
  @ApiOkResponse({ type: SalePresenter })
  async findById(@Param('id') id: string): Promise<SalePresenter> {
    return await this.findSaleByIdUseCase.execute({ id });
  }

  @Get(':id/receipt')
  @Permission(PermissionSale.SALE_READER)
  @ApiOperation({ summary: 'Baixa o cupom em PDF da venda, se gerado' })
  @ApiParam({ name: 'id', description: 'Id da venda' })
  async getReceipt(@Param('id') id: string, @Res() reply: FastifyReply) {
    const { absolutePath } = await this.getSaleReceiptUseCase.execute({
      saleId: id,
    });

    return reply
      .type('application/pdf')
      .send(createReadStream(absolutePath));
  }
}
