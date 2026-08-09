import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { CreateCompanyDto } from '../dtos/create-company.dto';
import { UpdateCompanyDto } from '../dtos/update-company.dto';
import { CreateCompanyUseCase } from '../../application/usecase/create-company.usecase';
import { FindCompanyUseCase } from '../../application/usecase/find-company.usecase';
import { UpdateCompanyUseCase } from '../../application/usecase/update-company.usecase';
import { CreateCompanyPresenter } from '@/shared/infra/presenter/company/create-company.presenter';
import { Permission, Public } from '@/shared/infra/decorators/permission.decorator';
import { PermissionCompany } from '@/core/auth/domain/permissions-definition/company';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('v1/company')
export class CompanyController {
  constructor(
    private readonly createCompanyUseCase: CreateCompanyUseCase,
    private readonly findCompanyUseCase: FindCompanyUseCase,
    private readonly updateCompanyUseCase: UpdateCompanyUseCase,
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
}
