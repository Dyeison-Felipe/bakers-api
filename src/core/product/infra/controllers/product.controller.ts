import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateProductUseCase } from '../../application/usecase/create-product.usecase';
import { CreateProductDto } from '../dtos/create-product.dto';
import { CreateProductPresenter } from '@/shared/infra/presenter/product/create-product.presenter';
import { Permission } from '@/shared/infra/decorators/permission.decorator';
import { PermissionProduct } from '@/core/auth/domain/permissions-definition/product';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { FindAllProductByCompanyUseCase } from '../../application/usecase/find-all-product-by-company.usecase';
import { Pagination } from '@/shared/infra/presenter/pagination/pagination.presenter';
import { FindAllProductPresenter } from '@/shared/infra/presenter/product/find-all-products';
import { ConvertPresenter } from '@/shared/infra/presenter/converter/converter.presenter';

@Controller('v1/product')
export class ProductController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly findAllProductByCompanyUseCase: FindAllProductByCompanyUseCase,
  ) {}

  @Get()
  @Permission(PermissionProduct.PRODUCT_READER)
  async findAllPaginate(
    @Query('categoryId') categoryId?: string,
  ): Promise<Pagination<FindAllProductPresenter>> {
    return await this.findAllProductByCompanyUseCase.execute({
      categoryId,
    });

  }

  @Post()
  @Permission(PermissionProduct.PRODUCT_CREATE)
  @ApiOperation({
    summary: 'Criar produto',
    description:
      'Cria um novo produto vinculado à empresa do usuário autenticado.',
  })
  @ApiCreatedResponse({
    description: 'Produto criado com sucesso',
    type: CreateProductPresenter,
  })
  @ApiConflictResponse({
    description: 'Já existe um produto cadastrado com esse nome',
  })
  @ApiNotFoundResponse({
    description: 'Categoria não encontrada para cadastro do produto',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Dados inválidos para criação do produto',
  })
  @ApiUnauthorizedResponse({
    description: 'Usuário não autenticado ou sem permissão',
  })
  async create(@Body() dto: CreateProductDto): Promise<CreateProductPresenter> {
    return this.createProductUseCase.execute(dto);
  }
}
