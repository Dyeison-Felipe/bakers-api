import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { FindAllCategoriesByCompanyUseCase } from '../../application/usecase/find-all-categories.usecase';
import { CreateCategoryUseCase } from '../../application/usecase/create-category.usecase';
import { UpdateCategoryByCompanyUseCase } from '../../application/usecase/update-category.usecase';
import { FindAllCategoryPresenter } from '@/shared/infra/presenter/category/find-all-category.presenter';
import { CreateCategoryDto } from '../dtos/create-category.dto';
import { CreateCategoryPresenter } from '@/shared/infra/presenter/category/create-category.presenter';
import { UpdateCategoryDto } from '../dtos/update-category.dto';
import { UpdateCategoryPresenter } from '@/shared/infra/presenter/category/update-category.presenter';
import {
  Permission,
  Public,
} from '@/shared/infra/decorators/permission.decorator';
import { PermissionCategory } from '@/core/auth/domain/permissions-definition/category';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateCompanyPresenter } from '@/shared/infra/presenter/company/create-company.presenter';
import { CreateCompanyDto } from '@/core/company/infra/dtos/create-company.dto';

@Controller('v1/category')
export class CategoryController {
  constructor(
    private readonly findAllCategoriesByCompanyUseCase: FindAllCategoriesByCompanyUseCase,
    private readonly createCategoryByCompanyUseCase: CreateCategoryUseCase,
    private readonly updateCategoryByCompanyUseCase: UpdateCategoryByCompanyUseCase,
  ) {}

  @Get()
  @Permission(PermissionCategory.CATEGORY_READER)
  @ApiOperation({
    summary: 'Listar Categorias',
    description: 'Retorna uma lista de todas as categorias cadastradas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Categorias listadas com sucesso',
    type: FindAllCategoryPresenter,
  })
  @ApiResponse({
    status: 500,
    description: 'Erro ao listar categorias',
  })
  async findAll(): Promise<FindAllCategoryPresenter[]> {
    return await this.findAllCategoriesByCompanyUseCase.execute();
  }

  @Post()
  @Permission(PermissionCategory.CATEGORY_CREATE)
  @ApiOperation({
    summary: 'Criar categoria',
    description: 'Realiza o cadastro de uma nova categoria no sistema.',
  })
  @ApiBody({
    type: CreateCategoryDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Categoria criada com sucesso',
    type: CreateCategoryPresenter,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'Categoria já cadastrada',
  })
  async create(
    @Body() dto: CreateCategoryDto,
  ): Promise<CreateCategoryPresenter> {
    return await this.createCategoryByCompanyUseCase.execute(dto);
  }

  @Put()
  @Permission(PermissionCategory.CATEGORY_UPDATE)
  @ApiOperation({
    summary: 'Atualizar categoria',
    description: 'Realiza a atualização de uma categoria existente no sistema.',
  })
  @ApiBody({
    type: UpdateCategoryDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Categoria atualizada com sucesso',
    type: UpdateCategoryPresenter,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro ao atualizar categoria',
  })
  async update(
    @Body() dto: UpdateCategoryDto,
  ): Promise<UpdateCategoryPresenter> {
    return await this.updateCategoryByCompanyUseCase.execute(dto);
  }
}
