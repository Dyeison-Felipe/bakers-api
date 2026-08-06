import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardSummaryPresenter } from '@/shared/infra/presenter/dashboard/dashboard-summary.presenter';
import { FindDashboardSummaryUseCase } from '../../application/usecase/find-dashboard-summary.usecase';

@ApiTags('Dashboard')
@Controller('v1/dashboard')
export class DashboardController {
  constructor(
    private readonly findDashboardSummaryUseCase: FindDashboardSummaryUseCase,
  ) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Resumo do dashboard',
    description:
      'Entradas do dia por forma de pagamento (dinheiro, Pix, cartão), custo de produção do dia e despesas do dia.',
  })
  @ApiOkResponse({ type: DashboardSummaryPresenter })
  async summary(): Promise<DashboardSummaryPresenter> {
    return await this.findDashboardSummaryUseCase.execute();
  }
}
