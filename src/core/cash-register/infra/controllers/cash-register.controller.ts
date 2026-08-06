import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Permission } from '@/shared/infra/decorators/permission.decorator';
import { PermissionCashRegister } from '@/core/auth/domain/permissions-definition/cash-register';
import { Pagination } from '@/shared/infra/presenter/pagination/pagination.presenter';
import { OpenCashRegisterPresenter } from '@/shared/infra/presenter/cash-register/open-cash-register.presenter';
import { FindOpenCashRegisterPresenter } from '@/shared/infra/presenter/cash-register/find-open-cash-register.presenter';
import { CloseCashRegisterPresenter } from '@/shared/infra/presenter/cash-register/close-cash-register.presenter';
import { FindAllCashRegisterSessionsItemPresenter } from '@/shared/infra/presenter/cash-register/find-all-cash-register-sessions-item.presenter';
import { CashRegisterSessionDetailPresenter } from '@/shared/infra/presenter/cash-register/cash-register-session-detail.presenter';
import { CashRegisterMovementPresenter } from '@/shared/infra/presenter/cash-register/cash-register-movement.presenter';
import { OpenCashRegisterDto } from '../dtos/open-cash-register.dto';
import { CreateCashRegisterMovementDto } from '../dtos/create-cash-register-movement.dto';
import { OpenCashRegisterSessionUseCase } from '../../application/usecase/open-cash-register-session.usecase';
import { FindOpenCashRegisterSessionUseCase } from '../../application/usecase/find-open-cash-register-session.usecase';
import { CloseCashRegisterSessionUseCase } from '../../application/usecase/close-cash-register-session.usecase';
import { FindAllCashRegisterSessionsUseCase } from '../../application/usecase/find-all-cash-register-sessions.usecase';
import { FindCashRegisterSessionDetailUseCase } from '../../application/usecase/find-cash-register-session-detail.usecase';
import { CreateCashRegisterMovementUseCase } from '../../application/usecase/create-cash-register-movement.usecase';
import { FindCashRegisterMovementsUseCase } from '../../application/usecase/find-cash-register-movements.usecase';

@ApiTags('Cash Register')
@Controller('v1/cash-register')
export class CashRegisterController {
  constructor(
    private readonly openCashRegisterSessionUseCase: OpenCashRegisterSessionUseCase,
    private readonly findOpenCashRegisterSessionUseCase: FindOpenCashRegisterSessionUseCase,
    private readonly closeCashRegisterSessionUseCase: CloseCashRegisterSessionUseCase,
    private readonly findAllCashRegisterSessionsUseCase: FindAllCashRegisterSessionsUseCase,
    private readonly findCashRegisterSessionDetailUseCase: FindCashRegisterSessionDetailUseCase,
    private readonly createCashRegisterMovementUseCase: CreateCashRegisterMovementUseCase,
    private readonly findCashRegisterMovementsUseCase: FindCashRegisterMovementsUseCase,
  ) {}

  @Post('open')
  @Permission(PermissionCashRegister.CASH_REGISTER_OPEN)
  @ApiOperation({
    summary: 'Abre o caixa',
    description:
      'Abre um novo caixa para a empresa informando o valor inicial em dinheiro.',
  })
  @ApiOkResponse({ type: OpenCashRegisterPresenter })
  @ApiConflictResponse({ description: 'Já existe um caixa aberto' })
  @ApiUnauthorizedResponse({
    description: 'Usuário não autenticado ou sem permissão',
  })
  async open(
    @Body() dto: OpenCashRegisterDto,
  ): Promise<OpenCashRegisterPresenter> {
    return await this.openCashRegisterSessionUseCase.execute(dto);
  }

  @Get('open')
  @Permission(PermissionCashRegister.CASH_REGISTER_READER)
  @ApiOperation({ summary: 'Busca o caixa aberto atual da empresa, se houver' })
  @ApiOkResponse({ type: FindOpenCashRegisterPresenter })
  async findOpen(): Promise<FindOpenCashRegisterPresenter | null> {
    return await this.findOpenCashRegisterSessionUseCase.execute();
  }

  @Patch(':id/close')
  @Permission(PermissionCashRegister.CASH_REGISTER_CLOSE)
  @ApiOperation({
    summary: 'Fecha o caixa',
    description:
      'Fecha o caixa informado, retornando o valor de abertura e os totais vendidos em dinheiro, pix e cartão separadamente.',
  })
  @ApiParam({ name: 'id', description: 'Id do caixa' })
  @ApiOkResponse({ type: CloseCashRegisterPresenter })
  async close(
    @Param('id') id: string,
  ): Promise<CloseCashRegisterPresenter> {
    return await this.closeCashRegisterSessionUseCase.execute({ id });
  }

  @Get()
  @Permission(PermissionCashRegister.CASH_REGISTER_READER)
  @ApiOperation({ summary: 'Lista o histórico de sessões de caixa' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: FindAllCashRegisterSessionsItemPresenter, isArray: true })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<Pagination<FindAllCashRegisterSessionsItemPresenter>> {
    return await this.findAllCashRegisterSessionsUseCase.execute({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  @Permission(PermissionCashRegister.CASH_REGISTER_READER)
  @ApiOperation({
    summary: 'Detalha uma sessão de caixa',
    description:
      'Traz abertura/fechamento, total vendido, custo de produção do dia, despesas do dia e o lucro apurado.',
  })
  @ApiParam({ name: 'id', description: 'Id do caixa' })
  @ApiOkResponse({ type: CashRegisterSessionDetailPresenter })
  async findDetail(
    @Param('id') id: string,
  ): Promise<CashRegisterSessionDetailPresenter> {
    return await this.findCashRegisterSessionDetailUseCase.execute({ id });
  }

  @Post('movement')
  @Permission(PermissionCashRegister.CASH_REGISTER_MOVEMENT_CREATE)
  @ApiOperation({
    summary: 'Registra sangria ou incremento no caixa aberto',
    description:
      'Sangria (retirada) exige motivo e, se o motivo for pagamento de despesa, cria automaticamente um lançamento na tela de Despesas. Incremento é entrada de dinheiro no caixa.',
  })
  @ApiOkResponse({ type: CashRegisterMovementPresenter })
  async createMovement(
    @Body() dto: CreateCashRegisterMovementDto,
  ): Promise<CashRegisterMovementPresenter> {
    return await this.createCashRegisterMovementUseCase.execute(dto);
  }

  @Get(':id/movements')
  @Permission(PermissionCashRegister.CASH_REGISTER_READER)
  @ApiOperation({ summary: 'Lista as sangrias e incrementos de um caixa' })
  @ApiParam({ name: 'id', description: 'Id do caixa' })
  @ApiOkResponse({ type: CashRegisterMovementPresenter, isArray: true })
  async findMovements(
    @Param('id') id: string,
  ): Promise<CashRegisterMovementPresenter[]> {
    return await this.findCashRegisterMovementsUseCase.execute({
      cashRegisterSessionId: id,
    });
  }
}
