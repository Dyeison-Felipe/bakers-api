import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  AllowExpiredPlan,
  Permission,
} from '@/shared/infra/decorators/permission.decorator';
import { PermissionCompany } from '@/core/auth/domain/permissions-definition/company';
import { CompanySubscriptionOutput } from '@/shared/application/output/subscription/company-subscription.output';
import { FindCompanySubscriptionUseCase } from '../../application/usecase/find-company-subscription.usecase';
import { SubscribePlanUseCase } from '../../application/usecase/subscribe-plan.usecase';
import { CancelSubscriptionUseCase } from '../../application/usecase/cancel-subscription.usecase';
import { ResumeSubscriptionUseCase } from '../../application/usecase/resume-subscription.usecase';
import { SubscribePlanDto } from '../dtos/subscribe-plan.dto';

@ApiTags('Subscription')
@Controller('v1/subscription')
export class SubscriptionController {
  constructor(
    private readonly findCompanySubscriptionUseCase: FindCompanySubscriptionUseCase,
    private readonly subscribePlanUseCase: SubscribePlanUseCase,
    private readonly cancelSubscriptionUseCase: CancelSubscriptionUseCase,
    private readonly resumeSubscriptionUseCase: ResumeSubscriptionUseCase,
  ) {}

  @Get()
  @AllowExpiredPlan()
  @Permission(PermissionCompany.COMPANY_READER)
  @ApiOperation({
    summary: 'Situação da assinatura',
    description:
      'Plano em vigor, vencimento e a assinatura paga mais recente da empresa do usuário logado. Disponível mesmo com o plano vencido.',
  })
  @ApiResponse({ status: 200, description: 'Situação da assinatura' })
  async find(): Promise<CompanySubscriptionOutput> {
    return await this.findCompanySubscriptionUseCase.execute();
  }

  @Post()
  @AllowExpiredPlan()
  @Permission(PermissionCompany.COMPANY_UPDATE)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Assinar um plano pago',
    description:
      'Assina um plano pago de dentro do sistema (plano vencido ou troca do plano gratuito). A empresa só muda de plano quando o Stripe confirmar a 1ª cobrança — acompanhe pelo GET.',
  })
  @ApiBody({ type: SubscribePlanDto })
  @ApiResponse({ status: 202, description: 'Cobrança enviada, aguardando confirmação' })
  @ApiResponse({ status: 409, description: 'Já existe uma assinatura ativa ou pendente' })
  async subscribe(@Body() dto: SubscribePlanDto): Promise<void> {
    await this.subscribePlanUseCase.execute(dto);
  }

  @Post('cancel')
  @Permission(PermissionCompany.COMPANY_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Cancelar assinatura',
    description:
      'Cancela a cobrança recorrente da assinatura da empresa do usuário logado. A empresa continua ativa até o fim do período já pago — não há cobrança nova depois disso.',
  })
  @ApiResponse({ status: 204, description: 'Assinatura cancelada' })
  async cancel(): Promise<void> {
    await this.cancelSubscriptionUseCase.execute();
  }

  @Post('resume')
  @Permission(PermissionCompany.COMPANY_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Reativar assinatura cancelada',
    description:
      'Desfaz o cancelamento enquanto o período pago ainda não acabou — a cobrança recorrente volta a acontecer normalmente.',
  })
  @ApiResponse({ status: 204, description: 'Assinatura reativada' })
  @ApiResponse({ status: 400, description: 'A assinatura já foi encerrada' })
  async resume(): Promise<void> {
    await this.resumeSubscriptionUseCase.execute();
  }
}
