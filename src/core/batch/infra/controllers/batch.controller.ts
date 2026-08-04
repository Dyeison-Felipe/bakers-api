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
import { UpdateBatchDto } from '../dtos/update-batch.dto';
import { WriteOffBatchDto } from '../dtos/write-off-batch.dto';
import { FindAllBatchesUseCase } from '../../application/usecase/find-all-batches.usecase';
import { FindBatchByIdUseCase } from '../../application/usecase/find-batch-by-id.usecase';
import { UpdateBatchUseCase } from '../../application/usecase/update-batch.usecase';
import { DeleteBatchUseCase } from '../../application/usecase/delete-batch.usecase';
import { WriteOffBatchUseCase } from '../../application/usecase/write-off-batch.usecase';
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
  ) {}

  @Get()
  @Permission(PermissionBatch.BATCH_READER)
  @ApiOperation({
    summary: 'Lista os lotes',
    description:
      'Retorna a lista paginada de lotes da empresa logada, podendo ser filtrada por produto.',
  })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'onlyAvailable', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: BatchPresenter, isArray: true })
  async findAll(
    @Query('productId') productId?: string,
    @Query('onlyAvailable') onlyAvailable?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<Pagination<BatchPresenter>> {
    return await this.findAllBatchesUseCase.execute({
      productId,
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
}
