import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CreateCompanyDto } from '../dtos/create-company.dto';
import { UpdateCompanyDto } from '../dtos/update-company.dto';
import { AdminUpdateCompanyDto } from '../dtos/admin-update-company.dto';
import { CreateCompanyUseCase } from '../../application/usecase/create-company.usecase';
import { FindCompanyUseCase } from '../../application/usecase/find-company.usecase';
import { UpdateCompanyUseCase } from '../../application/usecase/update-company.usecase';
import { FindAllCompaniesUseCase } from '../../application/usecase/find-all-companies.usecase';
import { SuperAdminUpdateCompanyUseCase } from '../../application/usecase/super-admin-update-company.usecase';
import { CreateCompanyPresenter } from '@/shared/infra/presenter/company/create-company.presenter';
import { Permission, Public, SuperAdminOnly } from '@/shared/infra/decorators/permission.decorator';
import { PermissionCompany } from '@/core/auth/domain/permissions-definition/company';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Pagination } from '@/shared/domain/pagination/pagination';
import { CompanyListItemOutput } from '@/shared/application/output/company/company-list-item.output';

@Controller('v1/company')
export class CompanyController {
  constructor(
    private readonly createCompanyUseCase: CreateCompanyUseCase,
    private readonly findCompanyUseCase: FindCompanyUseCase,
    private readonly updateCompanyUseCase: UpdateCompanyUseCase,
    private readonly findAllCompaniesUseCase: FindAllCompaniesUseCase,
    private readonly superAdminUpdateCompanyUseCase: SuperAdminUpdateCompanyUseCase,
  ) {}

  @Post()
  @Public()
  @ApiOperation({
    summary: 'Criar empresa',
    description: 'Realiza o cadastro de uma nova empresa no sistema.',
  })
  @ApiBody({
    type: CreateCompanyDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Empresa criada com sucesso',
    type: CreateCompanyPresenter,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'Empresa já cadastrada',
  })
  async create(@Body() dto: CreateCompanyDto): Promise<CreateCompanyPresenter> {
    return await this.createCompanyUseCase.execute(dto);
  }

  @Get()
  @Permission(PermissionCompany.COMPANY_READER)
  @ApiOperation({
    summary: 'Buscar empresa',
    description: 'Retorna os dados da empresa do usuário logado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dados da empresa',
    type: CreateCompanyPresenter,
  })
  async find(): Promise<CreateCompanyPresenter> {
    return await this.findCompanyUseCase.execute();
  }

  @Put()
  @Permission(PermissionCompany.COMPANY_UPDATE)
  @ApiOperation({
    summary: 'Atualizar empresa',
    description: 'Atualiza os dados da empresa do usuário logado.',
  })
  @ApiBody({
    type: UpdateCompanyDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Empresa atualizada com sucesso',
    type: CreateCompanyPresenter,
  })
  async update(
    @Body() dto: UpdateCompanyDto,
  ): Promise<CreateCompanyPresenter> {
    return await this.updateCompanyUseCase.execute(dto);
  }

  @Get('all')
  @SuperAdminOnly()
  @ApiOperation({
    summary: 'Listar todas as empresas (Super Admin)',
    description:
      'Retorna a lista paginada de todas as empresas cadastradas no sistema, com o plano contratado e a expiração.',
  })
  @ApiResponse({ status: 200, description: 'Lista de empresas retornada com sucesso' })
  async findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<Pagination<CompanyListItemOutput>> {
    return await this.findAllCompaniesUseCase.execute({
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Put(':id/admin')
  @SuperAdminOnly()
  @ApiOperation({
    summary: 'Atualizar empresa (Super Admin)',
    description:
      'Atualiza os dados cadastrais, o plano e/ou o status (ativa/inativa) de qualquer empresa do sistema.',
  })
  @ApiBody({ type: AdminUpdateCompanyDto })
  @ApiResponse({ status: 200, description: 'Empresa atualizada com sucesso' })
  async adminUpdate(
    @Param('id') id: string,
    @Body() dto: AdminUpdateCompanyDto,
  ): Promise<CreateCompanyPresenter> {
    return await this.superAdminUpdateCompanyUseCase.execute({ id, ...dto });
  }
}
