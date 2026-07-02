import { Body, Controller, Get, Post, Put } from '@nestjs/common';
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

@Controller('v1/category')
export class CategoryController {
  constructor(
    private readonly findAllCategoriesByCompanyUseCase: FindAllCategoriesByCompanyUseCase,
    private readonly createCategoryByCompanyUseCase: CreateCategoryUseCase,
    private readonly updateCategoryByCompanyUseCase: UpdateCategoryByCompanyUseCase,
  ) {}

  @Get()
  @Permission(PermissionCategory.CATEGORY_READER)
  async findAll(): Promise<FindAllCategoryPresenter[]> {
    return await this.findAllCategoriesByCompanyUseCase.execute();
  }

  @Post()
  @Permission(PermissionCategory.CATEGORY_CREATE)
  async create(
    @Body() dto: CreateCategoryDto,
  ): Promise<CreateCategoryPresenter> {
    return await this.createCategoryByCompanyUseCase.execute(dto);
  }

  @Put()
  @Permission(PermissionCategory.CATEGORY_UPDATE)
  async update(
    @Body() dto: UpdateCategoryDto,
  ): Promise<UpdateCategoryPresenter> {
    return await this.updateCategoryByCompanyUseCase.execute(dto);
  }
}
