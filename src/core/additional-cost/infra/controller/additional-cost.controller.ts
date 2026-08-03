// core/additional-cost/infra/http/controllers/additional-cost.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateAdditionalCostUseCase } from '../../application/usecases/create-additional-cost.usecase';
import { UpdateAdditionalCostUseCase } from '../../application/usecases/update-additional-cost.usecase';
import { DeleteAdditionalCostUseCase } from '../../application/usecases/delete-additional-cost.usecase';
import { FindAdditionalCostByIdUseCase } from '../../application/usecases/find-additional-cost-by-id.usecase';
import { FindAllAdditionalCostsByCompanyUseCase } from '../../application/usecases/find-all-additional-costs-by-company.usecase';
import { AdditionalCostPresenter } from '@/shared/infra/presenter/additional-cost/additional-cost.presenter';
import { CreateAdditionalCostDto } from '../dtos/create-additional-cost.dto';
import { UpdateAdditionalCostDto } from '../dtos/update-additional-cost.dto';
import { PermissionProduct } from '@/core/auth/domain/permissions-definition/product';
import { Permission } from '@/shared/infra/decorators/permission.decorator';

@ApiTags('Additional Costs')
@Controller('v1/additional-cost')
export class AdditionalCostController {
  constructor(
    private readonly createAdditionalCostUseCase: CreateAdditionalCostUseCase,
    private readonly updateAdditionalCostUseCase: UpdateAdditionalCostUseCase,
    private readonly deleteAdditionalCostUseCase: DeleteAdditionalCostUseCase,
    private readonly findAdditionalCostByIdUseCase: FindAdditionalCostByIdUseCase,
    private readonly findAllAdditionalCostsByCompanyUseCase: FindAllAdditionalCostsByCompanyUseCase,
  ) {}

  @Post()
  @Permission(PermissionProduct.PRODUCT_CREATE)
  @ApiOperation({ summary: 'Cria um novo gasto adicional' })
  @ApiResponse({ status: 201, type: AdditionalCostPresenter })
  async create(@Body() dto: CreateAdditionalCostDto) {
    return await this.createAdditionalCostUseCase.execute(dto);
  }

  @Put(':id')
  @Permission(PermissionProduct.PRODUCT_UPDATE)
  @ApiOperation({ summary: 'Atualiza um gasto adicional' })
  @ApiParam({ name: 'id', description: 'Id do gasto adicional' })
  @ApiResponse({ status: 200, type: AdditionalCostPresenter })
  async update(@Param('id') id: string, @Body() dto: UpdateAdditionalCostDto) {
    return await this.updateAdditionalCostUseCase.execute({
      id,
      name: dto.name,
    });
  }

  @Delete(':id')
  @Permission(PermissionProduct.PRODUCT_DELETE)
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove um gasto adicional' })
  @ApiParam({ name: 'id', description: 'Id do gasto adicional' })
  @ApiResponse({ status: 204 })
  async delete(@Param('id') id: string) {
    await this.deleteAdditionalCostUseCase.execute({ id });
  }

  @Get(':id')
  @Permission(PermissionProduct.PRODUCT_READER)
  @ApiOperation({ summary: 'Busca um gasto adicional pelo id' })
  @ApiParam({ name: 'id', description: 'Id do gasto adicional' })
  @ApiResponse({ status: 200, type: AdditionalCostPresenter })
  async findById(@Param('id') id: string) {
    return await this.findAdditionalCostByIdUseCase.execute({ id });
  }

  @Get()
  @Permission(PermissionProduct.PRODUCT_READER)
  @ApiOperation({ summary: 'Lista os gastos adicionais da empresa logada' })
  @ApiResponse({ status: 200, type: AdditionalCostPresenter })
  async findAll(): Promise<AdditionalCostPresenter[]> {
    return await this.findAllAdditionalCostsByCompanyUseCase.execute();
  }
}
