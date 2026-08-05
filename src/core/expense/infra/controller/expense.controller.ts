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
import { ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Permission } from '@/shared/infra/decorators/permission.decorator';
import { PermissionExpense } from '@/core/auth/domain/permissions-definition/expense';
import { Pagination } from '@/shared/infra/presenter/pagination/pagination.presenter';
import { ExpensePresenter } from '@/shared/infra/presenter/expense/expense.presenter';
import { parseDateOnly } from '@/shared/infra/utils/parse-date-only';
import { CreateExpenseDto } from '../dtos/create-expense.dto';
import { UpdateExpenseDto } from '../dtos/update-expense.dto';
import { CreateExpenseUseCase } from '../../application/usecases/create-expense.usecase';
import { UpdateExpenseUseCase } from '../../application/usecases/update-expense.usecase';
import { DeleteExpenseUseCase } from '../../application/usecases/delete-expense.usecase';
import { FindAllExpensesByCompanyUseCase } from '../../application/usecases/find-all-expenses-by-company.usecase';

@ApiTags('Expense')
@Controller('v1/expense')
export class ExpenseController {
  constructor(
    private readonly createExpenseUseCase: CreateExpenseUseCase,
    private readonly updateExpenseUseCase: UpdateExpenseUseCase,
    private readonly deleteExpenseUseCase: DeleteExpenseUseCase,
    private readonly findAllExpensesByCompanyUseCase: FindAllExpensesByCompanyUseCase,
  ) {}

  @Post()
  @Permission(PermissionExpense.EXPENSE_CREATE)
  @ApiOperation({ summary: 'Lança uma despesa do dia' })
  @ApiOkResponse({ type: ExpensePresenter })
  async create(@Body() dto: CreateExpenseDto): Promise<ExpensePresenter> {
    return await this.createExpenseUseCase.execute({
      date: parseDateOnly(dto.date),
      value: dto.value,
      description: dto.description,
    });
  }

  @Put(':id')
  @Permission(PermissionExpense.EXPENSE_UPDATE)
  @ApiOperation({ summary: 'Atualiza uma despesa' })
  @ApiParam({ name: 'id', description: 'Id da despesa' })
  @ApiOkResponse({ type: ExpensePresenter })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ): Promise<ExpensePresenter> {
    return await this.updateExpenseUseCase.execute({
      id,
      date: parseDateOnly(dto.date),
      value: dto.value,
      description: dto.description,
    });
  }

  @Delete(':id')
  @Permission(PermissionExpense.EXPENSE_DELETE)
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove uma despesa' })
  @ApiParam({ name: 'id', description: 'Id da despesa' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteExpenseUseCase.execute({ id });
  }

  @Get()
  @Permission(PermissionExpense.EXPENSE_READER)
  @ApiOperation({ summary: 'Lista as despesas da empresa logada' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: ExpensePresenter, isArray: true })
  async findAll(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<Pagination<ExpensePresenter>> {
    return await this.findAllExpensesByCompanyUseCase.execute({
      dateFrom: dateFrom ? parseDateOnly(dateFrom) : undefined,
      dateTo: dateTo ? parseDateOnly(dateTo) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
