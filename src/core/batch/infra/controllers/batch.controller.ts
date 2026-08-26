import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Permission } from '@/shared/infra/decorators/permission.decorator';
import { PermissionBatch } from '@/core/auth/domain/permissions-definition/batch';
import { Pagination } from '@/shared/infra/presenter/pagination/pagination.presenter';
import { BatchPresenter } from '@/shared/infra/presenter/batch/batch.presenter';
import { UpdateBatchPresenter } from '@/shared/infra/presenter/batch/update-batch.presenter';
import { WriteOffBatchPresenter } from '@/shared/infra/presenter/batch/write-off-batch.presenter';
import { FindTodayLeftoverBatchesPresenter } from '@/shared/infra/presenter/batch/find-today-leftover-batches.presenter';
import { DiscardBatchLeftoverPresenter } from '@/shared/infra/presenter/batch/discard-batch-leftover.presenter';
import { FindWasteMovementsPresenter } from '@/shared/infra/presenter/batch/find-waste-movements.presenter';
import { UpdateBatchDto } from '../dtos/update-batch.dto';
import { WriteOffBatchDto } from '../dtos/write-off-batch.dto';
import { DiscardBatchDto } from '../dtos/discard-batch.dto';
import { FindAllBatchesUseCase } from '../../application/usecase/find-all-batches.usecase';
import { FindBatchByIdUseCase } from '../../application/usecase/find-batch-by-id.usecase';
import { UpdateBatchUseCase } from '../../application/usecase/update-batch.usecase';
import { DeleteBatchUseCase } from '../../application/usecase/delete-batch.usecase';
import { WriteOffBatchUseCase } from '../../application/usecase/write-off-batch.usecase';
import { FindTodayLeftoverBatchesUseCase } from '../../application/usecase/find-today-leftover-batches.usecase';
import { DiscardBatchLeftoverUseCase } from '../../application/usecase/discard-batch-leftover.usecase';
import { FindWasteMovementsUseCase } from '../../application/usecase/find-waste-movements.usecase';
import { parseDateOnly } from '@/shared/infra/utils/parse-date-only';

@ApiTags('Batch')
@Controller('v1/batch')
export class BatchController {
  constructor(
    private readonly findAllBatchesUseCase: FindAllBatchesUseCase,
    private readonly findBatchByIdUseCase: FindBatchByIdUseCase,
    private readonly updateBatchUseCase: UpdateBatchUseCase,
    private readonly deleteBatchUseCase: DeleteBatchUseCase,
    private readonly writeOffBatchUseCase: WriteOffBatchUseCase,
    private readonly findTodayLeftoverBatchesUseCase: FindTodayLeftoverBatchesUseCase,
    private readonly discardBatchLeftoverUseCase: DiscardBatchLeftoverUseCase,
    private readonly findWasteMovementsUseCase: FindWasteMovementsUseCase,
  ) {}

  // Rota estática — precisa vir antes de ':id' pra não ser interpretada
  // como um id de lote.
  @Get('today-leftovers')
  @Permission(PermissionBatch.BATCH_READER)
  @ApiOperation({
    summary: 'Lista os lotes produzidos hoje que ainda têm sobra',
    description:
      'Usado no fechamento do dia para decidir o que fica em estoque e o que é descartado como desperdício.',
  })
  @ApiOkResponse({ type: FindTodayLeftoverBatchesPresenter })
  async todayLeftovers(): Promise<FindTodayLeftoverBatchesPresenter> {
    return await this.findTodayLeftoverBatchesUseCase.execute();
  }

  // Rota estática — mesmo motivo de 'today-leftovers': precisa vir antes de
  // ':id' pra não ser interpretada como um id de lote.
  @Get('waste')
  @Permission(PermissionBatch.BATCH_READER)
  @ApiOperation({
    summary: 'Lista os movimentos de desperdício por período',
    description:
      'Retorna os lançamentos de desperdício (baixa manual com motivo de perda) da empresa logada no período informado, usado pela tela de Desperdício.',
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

  @Get()
  @Permission(PermissionBatch.BATCH_READER)
  @ApiOperation({
    summary: 'Lista os lotes',
    description:
      'Retorna a lista paginada de lotes da empresa logada, podendo ser filtrada por produto.',
  })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({
    name: 'productName',
    required: false,
    description: 'Busca lotes cujo produto tenha nome contendo o texto informado.',
  })
  @ApiQuery({ name: 'onlyAvailable', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: BatchPresenter, isArray: true })
  async findAll(
    @Query('productId') productId?: string,
    @Query('productName') productName?: string,
    @Query('onlyAvailable') onlyAvailable?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<Pagination<BatchPresenter>> {
    return await this.findAllBatchesUseCase.execute({
      productId,
      productName,
      onlyAvailable: onlyAvailable === 'true',
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  @Permission(PermissionBatch.BATCH_READER)
  @ApiOperation({ summary: 'Busca um lote pelo id' })
  @ApiParam({ name: 'id', description: 'Id do lote' })
  @ApiOkResponse({ type: BatchPresenter })
  async findById(@Param('id') id: string): Promise<BatchPresenter> {
    return await this.findBatchByIdUseCase.execute({ id });
  }

  @Put(':id')
  @Permission(PermissionBatch.BATCH_UPDATE)
  @ApiOperation({
    summary: 'Corrige manualmente um lote',
    description: 'Corrige a quantidade e/ou a validade de um lote existente.',
  })
  @ApiParam({ name: 'id', description: 'Id do lote' })
  @ApiOkResponse({ type: UpdateBatchPresenter })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBatchDto,
  ): Promise<UpdateBatchPresenter> {
    return await this.updateBatchUseCase.execute({
      id,
      quantity: dto.quantity,
      expirationDate: dto.expirationDate ? parseDateOnly(dto.expirationDate) : undefined,
    });
  }

  @Delete(':id')
  @Permission(PermissionBatch.BATCH_DELETE)
  @ApiOperation({ summary: 'Remove um lote' })
  @ApiParam({ name: 'id', description: 'Id do lote' })
  @ApiOkResponse({ type: UpdateBatchPresenter })
  async delete(@Param('id') id: string): Promise<UpdateBatchPresenter> {
    return await this.deleteBatchUseCase.execute({ id });
  }

  @Post('write-off')
  @Permission(PermissionBatch.BATCH_WRITE_OFF)
  @ApiOperation({
    summary: 'Dá baixa manual em lotes de um produto (FEFO)',
    description:
      'Consome a quantidade solicitada dos lotes disponíveis do produto, priorizando os que vencem primeiro.',
  })
  @ApiOkResponse({ type: WriteOffBatchPresenter })
  async writeOff(@Body() dto: WriteOffBatchDto): Promise<WriteOffBatchPresenter> {
    return await this.writeOffBatchUseCase.execute({
      productId: dto.productId,
      quantity: dto.quantity,
      reason: dto.reason,
      reasonDescription: dto.reasonDescription,
    });
  }

  @Post(':id/discard')
  @Permission(PermissionBatch.BATCH_WRITE_OFF)
  @ApiOperation({
    summary: 'Descarta ou registra a venda ao custo da sobra de um lote',
    description:
      'Dá baixa na quantidade restante de um lote específico (ou parte dela). Por padrão registra como perda (desperdício); com soldAtCost=true registra como vendido pelo preço de custo, sem contar como perda.',
  })
  @ApiParam({ name: 'id', description: 'Id do lote' })
  @ApiOkResponse({ type: DiscardBatchLeftoverPresenter })
  async discard(
    @Param('id') id: string,
    @Body() dto: DiscardBatchDto,
  ): Promise<DiscardBatchLeftoverPresenter> {
    return await this.discardBatchLeftoverUseCase.execute({
      batchId: id,
      quantity: dto.quantity,
      reasonDescription: dto.reasonDescription,
      soldAtCost: dto.soldAtCost,
    });
  }
}
