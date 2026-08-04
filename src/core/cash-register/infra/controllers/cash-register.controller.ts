import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Permission } from '@/shared/infra/decorators/permission.decorator';
import { PermissionCashRegister } from '@/core/auth/domain/permissions-definition/cash-register';
import { OpenCashRegisterPresenter } from '@/shared/infra/presenter/cash-register/open-cash-register.presenter';
import { FindOpenCashRegisterPresenter } from '@/shared/infra/presenter/cash-register/find-open-cash-register.presenter';
import { CloseCashRegisterPresenter } from '@/shared/infra/presenter/cash-register/close-cash-register.presenter';
import { OpenCashRegisterDto } from '../dtos/open-cash-register.dto';
import { OpenCashRegisterSessionUseCase } from '../../application/usecase/open-cash-register-session.usecase';
import { FindOpenCashRegisterSessionUseCase } from '../../application/usecase/find-open-cash-register-session.usecase';
import { CloseCashRegisterSessionUseCase } from '../../application/usecase/close-cash-register-session.usecase';

@ApiTags('Cash Register')
@Controller('v1/cash-register')
export class CashRegisterController {
  constructor(
    private readonly openCashRegisterSessionUseCase: OpenCashRegisterSessionUseCase,
    private readonly findOpenCashRegisterSessionUseCase: FindOpenCashRegisterSessionUseCase,
    private readonly closeCashRegisterSessionUseCase: CloseCashRegisterSessionUseCase,
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
}
