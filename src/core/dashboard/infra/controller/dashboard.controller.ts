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
      'Custo de produção do dia e lucro apurado até o momento (vendas do dia − custo dos itens efetivamente vendidos).',
  })
  @ApiOkResponse({ type: DashboardSummaryPresenter })
  async summary(): Promise<DashboardSummaryPresenter> {
    return await this.findDashboardSummaryUseCase.execute();
  }
}
