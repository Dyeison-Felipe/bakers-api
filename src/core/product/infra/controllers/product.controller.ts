import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { CreateProductUseCase } from '../../application/usecase/create-product.usecase';
import { CreateProductDto } from '../dtos/create-product.dto';
import { CreateProductPresenter } from '@/shared/infra/presenter/product/create-product.presenter';
import { Permission } from '@/shared/infra/decorators/permission.decorator';
import { PermissionProduct } from '@/core/auth/domain/permissions-definition/product';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { FindAllProductByCompanyUseCase } from '../../application/usecase/find-all-product-by-company.usecase';
import { Pagination } from '@/shared/infra/presenter/pagination/pagination.presenter';
import { FindAllProductPresenter } from '@/shared/infra/presenter/product/find-all-products';
import { UpdateProductUseCase } from '../../application/usecase/update-product.usecase';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { UpdateProductPresenter } from '@/shared/infra/presenter/product/update-product.presenter';
import { UpdateStockDto } from '../dtos/update-stock.dto';
import { UpdateStockProductUseCase } from '../../application/usecase/increase-decrease-stock-product.usecase';
import { UpdateStockProductPresenter } from '@/shared/infra/presenter/product/update-stock-product.presenter';
import { ProductStatus } from '@/shared/infra/enums/product';

@Controller('v1/product')
export class ProductController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly findAllProductByCompanyUseCase: FindAllProductByCompanyUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly updateStockProductUseCase: UpdateStockProductUseCase,
  ) {}

  @Get()
  @Permission(PermissionProduct.PRODUCT_READER)
  @ApiOperation({
    summary: 'Listar produtos',
    description:
      'Retorna a lista paginada de produtos vinculados à empresa do usuário autenticado, podendo ser filtrada por categoria.',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'ID da categoria para filtrar os produtos',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ProductStatus,
    description:
      'Filtra produtos por status. Se não informado, retorna apenas produtos ativos.',
  })
  @ApiOkResponse({
    description: 'Lista de produtos retornada com sucesso',
    type: FindAllProductPresenter,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: 'Usuário não autenticado ou sem permissão',
  })
  async findAllPaginate(
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: ProductStatus,
  ): Promise<Pagination<FindAllProductPresenter>> {
    return await this.findAllProductByCompanyUseCase.execute({
      categoryId,
      status,
    });
  }

  @Put()
  @Permission(PermissionProduct.PRODUCT_UPDATE)
  @ApiOperation({
    summary: 'Atualizar produto',
    description: 'Atualiza os dados de um produto já cadastrado.',
  })
  @ApiOkResponse({
    description: 'Produto atualizado com sucesso',
    type: UpdateProductPresenter,
  })
  @ApiNotFoundResponse({
    description: 'Produto ou categoria não encontrados',
  })
  @ApiConflictResponse({
    description: 'Já existe um produto cadastrado com esse nome',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Dados inválidos para atualização do produto',
  })
  @ApiUnauthorizedResponse({
    description: 'Usuário não autenticado ou sem permissão',
  })
  async update(@Body() dto: UpdateProductDto): Promise<UpdateProductPresenter> {
    return await this.updateProductUseCase.execute(dto);
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

  @Put('stock')
  @Permission(PermissionProduct.PRODUCT_UPDATE)
  async updateStock(
    @Body() dto: UpdateStockDto,
  ): Promise<UpdateStockProductPresenter> {
    return await this.updateStockProductUseCase.execute(dto);
  }
}
