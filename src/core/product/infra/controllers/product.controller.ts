import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CreateProductUseCase } from '../../application/usecase/create-product.usecase';
import {
  CreateProductDto,
  CreateProductRequestDto,
} from '../dtos/create-product.dto';
import { CreateProductPresenter } from '@/shared/infra/presenter/product/create-product.presenter';
import { Permission } from '@/shared/infra/decorators/permission.decorator';
import { PermissionProduct } from '@/core/auth/domain/permissions-definition/product';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { FindAllProductByCompanyUseCase } from '../../application/usecase/find-all-product-by-company.usecase';
import { Pagination } from '@/shared/infra/presenter/pagination/pagination.presenter';
import { FindAllProductPresenter } from '@/shared/infra/presenter/product/find-all-products';
import { UpdateProductUseCase } from '../../application/usecase/update-product.usecase';
import {
  UpdateProductDto,
  UpdateProductRequestDto,
} from '../dtos/update-product.dto';
import { UpdateProductPresenter } from '@/shared/infra/presenter/product/update-product.presenter';
import { UpdateStockDto } from '../dtos/update-stock.dto';
import { UpdateStockProductUseCase } from '../../application/usecase/increase-decrease-stock-product.usecase';
import { UpdateStockProductPresenter } from '@/shared/infra/presenter/product/update-stock-product.presenter';
import { ProductStatus, TypeProduct } from '@/shared/infra/enums/product';
import { FindProductByIdAndCompanyId } from '../../application/usecase/find-product-by-id.usecase';
import { FindProductPresenter } from '@/shared/infra/presenter/product/product.presenter';
import { MulterFile } from '@/shared/application/storage/multer-file.type';
import { Multipart } from '@/shared/infra/decorators/multipart.decorator';
import { FastifyReply } from 'fastify';
import { GetProductImageUseCase } from '../../application/usecase/get-image.usecase';
import { createReadStream } from 'fs';
import { CalculateRecipeCostUseCase } from '../../application/usecase/calculate-recipe-cost.usecase';
import { CalculateUnitCostUseCase } from '../../application/usecase/calculate-unit-cost.usecase';
import { CalculateRecipeCostPresenter } from '@/shared/infra/presenter/product/calculate-recipe-cost.presenter';
import { CalculateRecipeCostDto } from '../dtos/calculate-recipe-cost.dto';
import { CalculateUnitCostPresenter } from '@/shared/infra/presenter/product/calculate-unit-cost.presenter';
import { CalculateUnitCostDto } from '../dtos/calculate-unit-cost.dto';
import { FindProductRecipePresenter } from '@/shared/infra/presenter/product/find-product-recipe-items.presenter';
import { FindProductRecipeUseCase } from '../../application/usecase/find-product-recipe-items.usecase';

@Controller('v1/product')
export class ProductController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly findAllProductByCompanyUseCase: FindAllProductByCompanyUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly updateStockProductUseCase: UpdateStockProductUseCase,
    private readonly findProductByIdAndCompanyId: FindProductByIdAndCompanyId,
    private readonly getProductImageUseCase: GetProductImageUseCase,
    private readonly calculateRecipeCostUseCase: CalculateRecipeCostUseCase,
    private readonly calculateUnitCostUseCase: CalculateUnitCostUseCase,
    private readonly findProductRecipeUseCase: FindProductRecipeUseCase,
  ) {}

  // no ProductController, adicionar:
  @Get(':id/recipe')
  @Permission(PermissionProduct.PRODUCT_READER)
  @ApiOperation({
    summary: 'Listar matérias-primas da receita',
    description:
      'Retorna os itens da receita (matéria-prima + quantidade) de um produto de produção própria.',
  })
  @ApiOkResponse({
    description: 'Itens da receita retornados com sucesso',
    type: FindProductRecipePresenter,
  })
  async findRecipeItems(
    @Param('id') id: string,
  ): Promise<FindProductRecipePresenter> {
    return await this.findProductRecipeUseCase.execute({ productId: id });
  }

  @Get(':productId')
  @Permission(PermissionProduct.PRODUCT_READER)
  @ApiOperation({
    summary: 'Listar produto',
    description: 'Retorna produto pelo id enviado.',
  })
  @ApiParam({
    name: 'productId',
    required: true,
    description: 'ID do produto',
  })
  @ApiOkResponse({
    description: 'Produto retornado com sucesso',
    type: FindAllProductPresenter,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: 'Usuário não autenticado ou sem permissão',
  })
  @ApiNotFoundResponse({
    description: 'Produto não encontrado',
  })
  async findProduct(
    @Param('productId') productId: string,
  ): Promise<FindProductPresenter> {
    return await this.findProductByIdAndCompanyId.execute({ productId });
  }

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
  @ApiQuery({
    name: 'typeProduct',
    required: false,
    enum: TypeProduct,
    description:
      'Filtra produtos por tipo. Se não informado, retorna todos os tipos de produtos.',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Busca produtos cujo nome contenha o texto informado.',
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
    @Query('typeProduct') typeProduct?: TypeProduct,
    @Query('status') status?: ProductStatus,
    @Query('name') name?: string,
  ): Promise<Pagination<FindAllProductPresenter>> {
    return await this.findAllProductByCompanyUseCase.execute({
      categoryId,
      status,
      typeProduct,
      name,
    });
  }

  @Put()
  @Multipart()
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
  async update(
    @Body() { productDto, image }: UpdateProductRequestDto,
  ): Promise<UpdateProductPresenter> {
    return await this.updateProductUseCase.execute({ ...productDto, image });
  }

  @Post()
  @Multipart()
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
  async create(
    @Body() { productDto, image }: CreateProductRequestDto,
  ): Promise<CreateProductPresenter> {
    return this.createProductUseCase.execute({ ...productDto, image });
  }

  @Put('stock')
  @Permission(PermissionProduct.PRODUCT_UPDATE)
  async updateStock(
    @Body() dto: UpdateStockDto,
  ): Promise<UpdateStockProductPresenter> {
    return await this.updateStockProductUseCase.execute(dto);
  }

  @Get(':id/image')
  async getImage(@Param('id') id: string, @Res() reply: FastifyReply) {
    const { absolutePath, mimetype } =
      await this.getProductImageUseCase.execute({
        productId: id,
      });

    return reply.type(mimetype).send(createReadStream(absolutePath));
  }

  @Post('calculate-recipe-cost')
  @Permission(PermissionProduct.PRODUCT_CREATE)
  @ApiOperation({
    summary: 'Calcular custo da receita',
    description:
      'Calcula o preço de custo de um produto de produção própria com base nas matérias-primas e quantidades informadas.',
  })
  @ApiOkResponse({
    description: 'Custo calculado com sucesso',
    type: CalculateRecipeCostPresenter,
  })
  @ApiNotFoundResponse({
    description: 'Uma ou mais matérias-primas não encontradas',
  })
  @ApiUnauthorizedResponse({
    description: 'Usuário não autenticado ou sem permissão',
  })
  async calculateRecipeCost(
    @Body() dto: CalculateRecipeCostDto,
  ): Promise<CalculateRecipeCostPresenter> {
    return await this.calculateRecipeCostUseCase.execute(dto);
  }

  @Post('calculate-unit-cost')
  @Permission(PermissionProduct.PRODUCT_CREATE)
  @ApiOperation({
    summary: 'Calcular custo unitário e por kg/ml',
    description:
      'Calcula o preço de custo unitário e por quilograma/mililitro com base no preço de custo total, quantidade, peso ou volume informados.',
  })
  @ApiOkResponse({
    description: 'Custo unitário calculado com sucesso',
    type: CalculateUnitCostPresenter,
  })
  @ApiUnauthorizedResponse({
    description: 'Usuário não autenticado ou sem permissão',
  })
  async calculateUnitCost(
    @Body() dto: CalculateUnitCostDto,
  ): Promise<CalculateUnitCostPresenter> {
    return this.calculateUnitCostUseCase.execute(dto);
  }
}
