import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Permission } from '@/shared/infra/decorators/permission.decorator';
import { PermissionCompany } from '@/core/auth/domain/permissions-definition/company';
import { CancelSubscriptionUseCase } from '../../application/usecase/cancel-subscription.usecase';

@Controller('v1/company/subscription')
export class SubscriptionController {
  constructor(
    private readonly cancelSubscriptionUseCase: CancelSubscriptionUseCase,
  ) {}

  @Post('cancel')
  @Permission(PermissionCompany.COMPANY_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Cancelar assinatura recorrente',
    description:
      'Cancela a cobrança recorrente da empresa logada no Mercado Pago. A empresa continua ativa normalmente até o fim do período já pago.',
  })
  @ApiResponse({ status: 204, description: 'Assinatura cancelada com sucesso' })
  async cancel(): Promise<void> {
    await this.cancelSubscriptionUseCase.execute();
  }
}
