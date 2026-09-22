import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Permission } from '@/shared/infra/decorators/permission.decorator';
import { PermissionRecipe } from '@/core/auth/domain/permissions-definition/recipe';
import { CreateRecipeUseCase } from '../../application/usecases/create-recipe.usecase';
import { UpdateRecipeUseCase } from '../../application/usecases/update-recipe.usecase';
import { DeleteRecipeUseCase } from '../../application/usecases/delete-recipe.usecase';
import { FindRecipeByIdUseCase } from '../../application/usecases/find-recipe-by-id.usecase';
import { FindAllRecipesByCompanyUseCase } from '../../application/usecases/find-all-recipes-by-company.usecase';
import { CreateRecipeDto } from '../dtos/create-recipe.dto';
import { UpdateRecipeDto } from '../dtos/update-recipe.dto';
import { RecipePresenter } from '@/shared/infra/presenter/recipe/recipe.presenter';
import { RecipeDetailPresenter } from '@/shared/infra/presenter/recipe/recipe-detail.presenter';
import { Pagination } from '@/shared/infra/presenter/pagination/pagination.presenter';
import { clampLimit } from '@/shared/infra/utils/clamp-limit';

@ApiTags('Recipes')
@Controller('v1/recipe')
export class RecipeController {
  constructor(
    private readonly createRecipeUseCase: CreateRecipeUseCase,
    private readonly updateRecipeUseCase: UpdateRecipeUseCase,
    private readonly deleteRecipeUseCase: DeleteRecipeUseCase,
    private readonly findRecipeByIdUseCase: FindRecipeByIdUseCase,
    private readonly findAllRecipesByCompanyUseCase: FindAllRecipesByCompanyUseCase,
  ) {}

  @Post()
  @Permission(PermissionRecipe.RECIPE_CREATE)
  @ApiOperation({ summary: 'Cria uma nova receita reutilizável' })
  @ApiCreatedResponse({ type: RecipePresenter })
  async create(@Body() dto: CreateRecipeDto) {
    return await this.createRecipeUseCase.execute(dto);
  }

  @Put(':id')
  @Permission(PermissionRecipe.RECIPE_UPDATE)
  @ApiOperation({ summary: 'Atualiza uma receita reutilizável' })
  @ApiParam({ name: 'id', description: 'Id da receita' })
  @ApiOkResponse({ type: RecipePresenter })
  async update(@Param('id') id: string, @Body() dto: UpdateRecipeDto) {
    return await this.updateRecipeUseCase.execute({ id, ...dto });
  }

  @Delete(':id')
  @Permission(PermissionRecipe.RECIPE_DELETE)
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove uma receita reutilizável' })
  @ApiParam({ name: 'id', description: 'Id da receita' })
  async delete(@Param('id') id: string) {
    await this.deleteRecipeUseCase.execute({ id });
  }

  @Get(':id')
  @Permission(PermissionRecipe.RECIPE_READER)
  @ApiOperation({ summary: 'Busca uma receita pelo id, com custo calculado' })
  @ApiParam({ name: 'id', description: 'Id da receita' })
  @ApiOkResponse({ type: RecipeDetailPresenter })
  async findById(@Param('id') id: string) {
    return await this.findRecipeByIdUseCase.execute({ id });
  }

  @Get()
  @Permission(PermissionRecipe.RECIPE_READER)
  @ApiOperation({
    summary: 'Lista paginada das receitas da empresa logada',
    description: 'Pode ser filtrada por nome (busca parcial, case-insensitive).',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Busca receitas cujo nome contenha o texto informado.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: RecipePresenter, isArray: true })
  async findAll(
    @Query('name') name?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<Pagination<RecipePresenter>> {
    return await this.findAllRecipesByCompanyUseCase.execute({
      name,
      page: page ? Number(page) : undefined,
      limit: clampLimit(limit),
    });
  }
}
