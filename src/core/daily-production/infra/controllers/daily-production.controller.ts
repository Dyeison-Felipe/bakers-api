import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { PermissionDailyProduction } from '@/core/auth/domain/permissions-definition/daily-production';
import { Pagination } from '@/shared/infra/presenter/pagination/pagination.presenter';
import { TypeDailyProductionStatus } from '@/shared/infra/enums/daily-production';
import { DailyProductionPresenter } from '@/shared/infra/presenter/daily-production/daily-production.presenter';
import { FindAllDailyProductionsPresenter } from '@/shared/infra/presenter/daily-production/find-all-daily-productions.presenter';
import { CreateDailyProductionPresenter } from '@/shared/infra/presenter/daily-production/create-daily-production.presenter';
import { AddDailyProductionItemPresenter } from '@/shared/infra/presenter/daily-production/add-daily-production-item.presenter';
import { RemoveDailyProductionItemPresenter } from '@/shared/infra/presenter/daily-production/remove-daily-production-item.presenter';
import { MarkItemAsProducedPresenter } from '@/shared/infra/presenter/daily-production/mark-item-as-produced.presenter';
import { CreateDailyProductionDto } from '../dtos/create-daily-production.dto';
import { AddDailyProductionItemDto } from '../dtos/add-daily-production-item.dto';
import { MarkItemProducedDto } from '../dtos/mark-item-produced.dto';
import { CreateDailyProductionUseCase } from '../../application/usecase/create-daily-production.usecase';
import { AddDailyProductionItemUseCase } from '../../application/usecase/add-daily-production-item.usecase';
import { RemoveDailyProductionItemUseCase } from '../../application/usecase/remove-daily-production-item.usecase';
import { MarkDailyProductionItemAsProducedUseCase } from '../../application/usecase/mark-item-as-produced.usecase';
import { FindDailyProductionByIdUseCase } from '../../application/usecase/find-daily-production-by-id.usecase';
import { FindAllDailyProductionsUseCase } from '../../application/usecase/find-all-daily-productions.usecase';
import { parseDateOnly } from '@/shared/infra/utils/parse-date-only';

@ApiTags('Daily Production')
@Controller('v1/daily-production')
export class DailyProductionController {
  constructor(
    private readonly createDailyProductionUseCase: CreateDailyProductionUseCase,
    private readonly addDailyProductionItemUseCase: AddDailyProductionItemUseCase,
    private readonly removeDailyProductionItemUseCase: RemoveDailyProductionItemUseCase,
    private readonly markDailyProductionItemAsProducedUseCase: MarkDailyProductionItemAsProducedUseCase,
    private readonly findDailyProductionByIdUseCase: FindDailyProductionByIdUseCase,
    private readonly findAllDailyProductionsUseCase: FindAllDailyProductionsUseCase,
  ) {}

  @Post()
  @Permission(PermissionDailyProduction.DAILY_PRODUCTION_CREATE)
  @ApiOperation({
    summary: 'Cria uma produção diária',
    description:
      'Cria a produção diária, opcionalmente já com os itens planejados.',
  })
  @ApiOkResponse({ type: CreateDailyProductionPresenter })
  async create(
    @Body() dto: CreateDailyProductionDto,
  ): Promise<CreateDailyProductionPresenter> {
    return await this.createDailyProductionUseCase.execute({
      productionDate: parseDateOnly(dto.productionDate),
      items: dto.items,
    });
  }

  @Get()
  @Permission(PermissionDailyProduction.DAILY_PRODUCTION_READER)
  @ApiOperation({ summary: 'Lista as produções diárias' })
  @ApiQuery({ name: 'status', required: false, enum: TypeDailyProductionStatus })
  @ApiQuery({ name: 'productionDate', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: FindAllDailyProductionsPresenter, isArray: true })
  async findAll(
    @Query('status') status?: TypeDailyProductionStatus,
    @Query('productionDate') productionDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<Pagination<FindAllDailyProductionsPresenter>> {
    return await this.findAllDailyProductionsUseCase.execute({
      status,
      productionDate: productionDate ? parseDateOnly(productionDate) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  @Permission(PermissionDailyProduction.DAILY_PRODUCTION_READER)
  @ApiOperation({ summary: 'Busca uma produção diária pelo id, com os itens' })
  @ApiParam({ name: 'id', description: 'Id da produção diária' })
  @ApiOkResponse({ type: DailyProductionPresenter })
  async findById(@Param('id') id: string): Promise<DailyProductionPresenter> {
    return await this.findDailyProductionByIdUseCase.execute({ id });
  }

  @Post(':id/items')
  @Permission(PermissionDailyProduction.DAILY_PRODUCTION_UPDATE)
  @ApiOperation({ summary: 'Adiciona um item à produção diária' })
  @ApiParam({ name: 'id', description: 'Id da produção diária' })
  @ApiOkResponse({ type: AddDailyProductionItemPresenter })
  async addItem(
    @Param('id') id: string,
    @Body() dto: AddDailyProductionItemDto,
  ): Promise<AddDailyProductionItemPresenter> {
    return await this.addDailyProductionItemUseCase.execute({
      dailyProductionId: id,
      productId: dto.productId,
      plannedQuantity: dto.plannedQuantity,
      recipeMultiplier: dto.recipeMultiplier,
    });
  }

  @Delete('items/:itemId')
  @Permission(PermissionDailyProduction.DAILY_PRODUCTION_DELETE)
  @ApiOperation({ summary: 'Remove um item planejado da produção diária' })
  @ApiParam({ name: 'itemId', description: 'Id do item de produção' })
  @ApiOkResponse({ type: RemoveDailyProductionItemPresenter })
  async removeItem(
    @Param('itemId') itemId: string,
  ): Promise<RemoveDailyProductionItemPresenter> {
    return await this.removeDailyProductionItemUseCase.execute({ id: itemId });
  }

  @Patch('items/:itemId/produce')
  @Permission(PermissionDailyProduction.DAILY_PRODUCTION_UPDATE)
  @ApiOperation({
    summary: 'Marca um item como produzido',
    description:
      'Marca o item como produzido, cria o lote de estoque correspondente e, para produtos em KG, exige o peso real produzido.',
  })
  @ApiParam({ name: 'itemId', description: 'Id do item de produção' })
  @ApiOkResponse({ type: MarkItemAsProducedPresenter })
  async produceItem(
    @Param('itemId') itemId: string,
    @Body() dto: MarkItemProducedDto,
  ): Promise<MarkItemAsProducedPresenter> {
    return await this.markDailyProductionItemAsProducedUseCase.execute({
      id: itemId,
      actualWeight: dto.actualWeight,
    });
  }
}
