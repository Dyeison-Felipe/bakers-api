import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Permission } from '@/shared/infra/decorators/permission.decorator';
import { PermissionStockMovement } from '@/core/auth/domain/permissions-definition/stock-movement';
import { RegisterWasteMovementPresenter } from '@/shared/infra/presenter/stock-movement/register-waste-movement.presenter';
import { FindWasteMovementsPresenter } from '@/shared/infra/presenter/stock-movement/find-waste-movements.presenter';
import { FindStockMovementsPresenter } from '@/shared/infra/presenter/stock-movement/find-stock-movements.presenter';
import { RegisterWasteMovementDto } from '../dtos/register-waste-movement.dto';
import { AdjustProductStockUseCase } from '../../application/usecase/adjust-product-stock.usecase';
import { FindWasteMovementsUseCase } from '../../application/usecase/find-waste-movements.usecase';
import { FindStockMovementsUseCase } from '../../application/usecase/find-stock-movements.usecase';
import {
  TypeStockMovement,
  TypeStockMovementReason,
} from '@/shared/infra/enums/stock-movement';
import { parseDateOnly } from '@/shared/infra/utils/parse-date-only';

@ApiTags('Stock Movement')
@Controller('v1/stock-movement')
export class StockMovementController {
  constructor(
    private readonly adjustProductStockUseCase: AdjustProductStockUseCase,
    private readonly findWasteMovementsUseCase: FindWasteMovementsUseCase,
    private readonly findStockMovementsUseCase: FindStockMovementsUseCase,
  ) {}

  @Get()
  @Permission(PermissionStockMovement.STOCK_MOVEMENT_READER)
  @ApiOperation({
    summary: 'Lista o histórico de movimentações de estoque por período',
    description:
      'Retorna todos os movimentos de estoque da empresa logada no período informado (produção, venda, desperdício, sobra vendida ao custo), usado pela tela de Estoque. Aceita filtrar por um motivo específico.',
  })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  @ApiQuery({ name: 'reason', required: false, enum: TypeStockMovementReason })
  @ApiOkResponse({ type: FindStockMovementsPresenter })
  async findAll(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('reason') reason?: TypeStockMovementReason,
  ): Promise<FindStockMovementsPresenter> {
    const from = parseDateOnly(dateFrom);
    const to = parseDateOnly(dateTo);
    to.setHours(23, 59, 59, 999);

    return await this.findStockMovementsUseCase.execute({
      dateFrom: from,
      dateTo: to,
      reason,
    });
  }

  @Post('waste')
  @Permission(PermissionStockMovement.STOCK_MOVEMENT_WRITE_OFF)
  @ApiOperation({
    summary: 'Registra perda/desperdício de um produto',
    description:
      'Baixa a quantidade informada do estoque do produto (se ele tiver controle de estoque) e registra o movimento para os relatórios de desperdício.',
  })
  @ApiOkResponse({ type: RegisterWasteMovementPresenter })
  async registerWaste(
    @Body() dto: RegisterWasteMovementDto,
  ): Promise<RegisterWasteMovementPresenter> {
    return await this.adjustProductStockUseCase.execute({
      productId: dto.productId,
      quantity: dto.quantity,
      type: TypeStockMovement.EXIT,
      reason: TypeStockMovementReason.WASTE,
      reasonDescription: dto.reasonDescription,
    });
  }

  @Get('waste')
  @Permission(PermissionStockMovement.STOCK_MOVEMENT_WASTE_READER)
  @ApiOperation({
    summary: 'Lista os movimentos de desperdício por período',
    description:
      'Retorna os lançamentos de desperdício da empresa logada no período informado, usado pela tela de Desperdício.',
  })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  @ApiOkResponse({ type: FindWasteMovementsPresenter })
  async waste(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ): Promise<FindWasteMovementsPresenter> {
    const from = parseDateOnly(dateFrom);
    const to = parseDateOnly(dateTo);
    to.setHours(23, 59, 59, 999);

    return await this.findWasteMovementsUseCase.execute({
      dateFrom: from,
      dateTo: to,
    });
  }
}
