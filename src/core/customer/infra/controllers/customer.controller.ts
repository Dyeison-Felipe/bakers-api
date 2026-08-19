import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Permission } from '@/shared/infra/decorators/permission.decorator';
import { PermissionCustomer } from '@/core/auth/domain/permissions-definition/customer';
import { Pagination } from '@/shared/infra/presenter/pagination/pagination.presenter';
import { CustomerPresenter } from '@/shared/infra/presenter/customer/customer.presenter';
import { CreateCustomerDto } from '../dtos/create-customer.dto';
import { UpdateCustomerDto } from '../dtos/update-customer.dto';
import { CreateCustomerUseCase } from '../../application/usecase/create-customer.usecase';
import { UpdateCustomerUseCase } from '../../application/usecase/update-customer.usecase';
import { FindCustomerByIdUseCase } from '../../application/usecase/find-customer-by-id.usecase';
import { FindAllCustomersUseCase } from '../../application/usecase/find-all-customers.usecase';
import { InactivateCustomerUseCase } from '../../application/usecase/inactivate-customer.usecase';

@ApiTags('Customer')
@Controller('v1/customer')
export class CustomerController {
  constructor(
    private readonly createCustomerUseCase: CreateCustomerUseCase,
    private readonly updateCustomerUseCase: UpdateCustomerUseCase,
    private readonly findCustomerByIdUseCase: FindCustomerByIdUseCase,
    private readonly findAllCustomersUseCase: FindAllCustomersUseCase,
    private readonly inactivateCustomerUseCase: InactivateCustomerUseCase,
  ) {}

  @Get()
  @Permission(PermissionCustomer.CUSTOMER_READER)
  @ApiOperation({
    summary: 'Listar clientes',
    description:
      'Retorna uma lista paginada de clientes, com busca opcional por nome ou CPF.',
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: CustomerPresenter, isArray: true })
  async findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<Pagination<CustomerPresenter>> {
    return await this.findAllCustomersUseCase.execute({
      search,
      pagination: {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      },
    });
  }

  @Get(':id')
  @Permission(PermissionCustomer.CUSTOMER_READER)
  @ApiOperation({ summary: 'Buscar cliente pelo id' })
  @ApiResponse({ status: 200, type: CustomerPresenter })
  async findById(@Param('id') id: string): Promise<CustomerPresenter> {
    return await this.findCustomerByIdUseCase.execute({ id });
  }

  @Post()
  @Permission(PermissionCustomer.CUSTOMER_CREATE)
  @ApiOperation({ summary: 'Cadastrar cliente' })
  @ApiBody({ type: CreateCustomerDto })
  @ApiResponse({ status: 201, type: CustomerPresenter })
  @ApiResponse({ status: 409, description: 'CPF já cadastrado' })
  async create(@Body() dto: CreateCustomerDto): Promise<CustomerPresenter> {
    return await this.createCustomerUseCase.execute(dto);
  }

  @Put()
  @Permission(PermissionCustomer.CUSTOMER_UPDATE)
  @ApiOperation({ summary: 'Atualizar cliente' })
  @ApiBody({ type: UpdateCustomerDto })
  @ApiResponse({ status: 200, type: CustomerPresenter })
  async update(@Body() dto: UpdateCustomerDto): Promise<CustomerPresenter> {
    return await this.updateCustomerUseCase.execute(dto);
  }

  @Delete(':id')
  @Permission(PermissionCustomer.CUSTOMER_DELETE)
  @ApiOperation({
    summary: 'Inativar cliente',
    description: 'Marca o cliente como inativo (soft delete).',
  })
  @ApiResponse({ status: 200 })
  async inactivate(@Param('id') id: string): Promise<void> {
    return await this.inactivateCustomerUseCase.execute({ id });
  }
}
