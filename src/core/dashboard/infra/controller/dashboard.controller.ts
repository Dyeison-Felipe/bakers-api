import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardSummaryPresenter } from '@/shared/infra/presenter/dashboard/dashboard-summary.presenter';
import { TopSellingProductPresenter } from '@/shared/infra/presenter/dashboard/top-selling-products.presenter';
import { FindTopSellingProductsUseCase } from '../../application/usecase/find-top-selling-products.usecase';
import { FindDashboardSummaryUseCase } from '../../application/usecase/find-dashboard-summary.usecase';

@ApiTags('Dashboard')
@Controller('v1/dashboard')
export class DashboardController {
  constructor(
    private readonly findDashboardSummaryUseCase: FindDashboardSummaryUseCase,
    private readonly findTopSellingProductsUseCase: FindTopSellingProductsUseCase,
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

  @Get('top-products')
  @ApiOperation({
    summary: 'Produtos mais vendidos no dia',
    description:
      'Até 10 produtos com maior quantidade vendida hoje, em ordem decrescente. Vazio se ainda não houve vendas ou se o plano não inclui PDV/Caixa.',
  })
  @ApiOkResponse({ type: TopSellingProductPresenter, isArray: true })
  async topProducts(): Promise<TopSellingProductPresenter[]> {
    const products = await this.findTopSellingProductsUseCase.execute();
    return products.map((product) => new TopSellingProductPresenter(product));
  }
}
