import { Controller, Get, Query, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Permission } from '@/shared/infra/decorators/permission.decorator';
import { PermissionReport } from '@/core/auth/domain/permissions-definition/report';
import { parseDateOnly } from '@/shared/infra/utils/parse-date-only';
import { WasteReportPresenter } from '@/shared/infra/presenter/report/waste-report.presenter';
import { CashRegisterReportPresenter } from '@/shared/infra/presenter/report/cash-register-report.presenter';
import { ProductionReportPresenter } from '@/shared/infra/presenter/report/production-report.presenter';
import { ExpenseReportPresenter } from '@/shared/infra/presenter/report/expense-report.presenter';
import { DailyRevenueSeriesPointPresenter } from '@/shared/infra/presenter/report/daily-revenue-series.presenter';
import { CostComparisonSeriesPointPresenter } from '@/shared/infra/presenter/report/cost-comparison-series.presenter';
import { PaymentMethodBreakdownPresenter } from '@/shared/infra/presenter/report/payment-method-breakdown.presenter';
import { TopWastedProductPointPresenter } from '@/shared/infra/presenter/report/top-wasted-products.presenter';
import { FindWasteReportUseCase } from '../../application/usecase/find-waste-report.usecase';
import { FindCashRegisterReportUseCase } from '../../application/usecase/find-cash-register-report.usecase';
import { FindProductionReportUseCase } from '../../application/usecase/find-production-report.usecase';
import { FindExpenseReportUseCase } from '../../application/usecase/find-expense-report.usecase';
import { FindDailyRevenueSeriesUseCase } from '../../application/usecase/find-daily-revenue-series.usecase';
import { FindCostComparisonSeriesUseCase } from '../../application/usecase/find-cost-comparison-series.usecase';
import { FindPaymentMethodBreakdownUseCase } from '../../application/usecase/find-payment-method-breakdown.usecase';
import { FindTopWastedProductsUseCase } from '../../application/usecase/find-top-wasted-products.usecase';
import { GenerateWasteReportPdfUseCase } from '../../application/usecase/generate-waste-report-pdf.usecase';
import { GenerateCashRegisterReportPdfUseCase } from '../../application/usecase/generate-cash-register-report-pdf.usecase';
import { GenerateProductionReportPdfUseCase } from '../../application/usecase/generate-production-report-pdf.usecase';
import { GenerateExpenseReportPdfUseCase } from '../../application/usecase/generate-expense-report-pdf.usecase';

const parseReportDateRange = (
  dateFrom: string,
  dateTo: string,
): { dateFrom: Date; dateTo: Date } => {
  const from = parseDateOnly(dateFrom);
  const to = parseDateOnly(dateTo);
  to.setHours(23, 59, 59, 999);

  return { dateFrom: from, dateTo: to };
};

@ApiTags('Report')
@Controller('v1/report')
export class ReportController {
  constructor(
    private readonly findWasteReportUseCase: FindWasteReportUseCase,
    private readonly findCashRegisterReportUseCase: FindCashRegisterReportUseCase,
    private readonly findProductionReportUseCase: FindProductionReportUseCase,
    private readonly findExpenseReportUseCase: FindExpenseReportUseCase,
    private readonly findDailyRevenueSeriesUseCase: FindDailyRevenueSeriesUseCase,
    private readonly findCostComparisonSeriesUseCase: FindCostComparisonSeriesUseCase,
    private readonly findPaymentMethodBreakdownUseCase: FindPaymentMethodBreakdownUseCase,
    private readonly findTopWastedProductsUseCase: FindTopWastedProductsUseCase,
    private readonly generateWasteReportPdfUseCase: GenerateWasteReportPdfUseCase,
    private readonly generateCashRegisterReportPdfUseCase: GenerateCashRegisterReportPdfUseCase,
    private readonly generateProductionReportPdfUseCase: GenerateProductionReportPdfUseCase,
    private readonly generateExpenseReportPdfUseCase: GenerateExpenseReportPdfUseCase,
  ) {}

  @Get('waste')
  @Permission(PermissionReport.REPORT_READER)
  @ApiOperation({ summary: 'Relatório de desperdício por período' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  @ApiOkResponse({ type: WasteReportPresenter })
  async waste(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ): Promise<WasteReportPresenter> {
    return await this.findWasteReportUseCase.execute(
      parseReportDateRange(dateFrom, dateTo),
    );
  }

  @Get('waste/pdf')
  @Permission(PermissionReport.REPORT_READER)
  @ApiOperation({ summary: 'Exporta o relatório de desperdício em PDF' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  async wastePdf(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Res() reply: FastifyReply,
  ) {
    const buffer = await this.generateWasteReportPdfUseCase.execute(
      parseReportDateRange(dateFrom, dateTo),
    );

    return reply
      .type('application/pdf')
      .header('Content-Disposition', 'attachment; filename="relatorio-desperdicio.pdf"')
      .send(buffer);
  }

  @Get('cash-register')
  @Permission(PermissionReport.REPORT_READER)
  @ApiOperation({ summary: 'Relatório de detalhe de caixa por período' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  @ApiOkResponse({ type: CashRegisterReportPresenter })
  async cashRegister(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ): Promise<CashRegisterReportPresenter> {
    return await this.findCashRegisterReportUseCase.execute(
      parseReportDateRange(dateFrom, dateTo),
    );
  }

  @Get('cash-register/pdf')
  @Permission(PermissionReport.REPORT_READER)
  @ApiOperation({ summary: 'Exporta o relatório de caixa em PDF' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  async cashRegisterPdf(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Res() reply: FastifyReply,
  ) {
    const buffer = await this.generateCashRegisterReportPdfUseCase.execute(
      parseReportDateRange(dateFrom, dateTo),
    );

    return reply
      .type('application/pdf')
      .header('Content-Disposition', 'attachment; filename="relatorio-caixa.pdf"')
      .send(buffer);
  }

  @Get('production')
  @Permission(PermissionReport.REPORT_READER)
  @ApiOperation({ summary: 'Relatório de custo de produção por período' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  @ApiOkResponse({ type: ProductionReportPresenter })
  async production(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ): Promise<ProductionReportPresenter> {
    return await this.findProductionReportUseCase.execute(
      parseReportDateRange(dateFrom, dateTo),
    );
  }

  @Get('production/pdf')
  @Permission(PermissionReport.REPORT_READER)
  @ApiOperation({ summary: 'Exporta o relatório de produção em PDF' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  async productionPdf(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Res() reply: FastifyReply,
  ) {
    const buffer = await this.generateProductionReportPdfUseCase.execute(
      parseReportDateRange(dateFrom, dateTo),
    );

    return reply
      .type('application/pdf')
      .header('Content-Disposition', 'attachment; filename="relatorio-producao.pdf"')
      .send(buffer);
  }

  @Get('expense')
  @Permission(PermissionReport.REPORT_READER)
  @ApiOperation({ summary: 'Relatório de despesas por período' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  @ApiOkResponse({ type: ExpenseReportPresenter })
  async expense(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ): Promise<ExpenseReportPresenter> {
    return await this.findExpenseReportUseCase.execute(
      parseReportDateRange(dateFrom, dateTo),
    );
  }

  @Get('expense/pdf')
  @Permission(PermissionReport.REPORT_READER)
  @ApiOperation({ summary: 'Exporta o relatório de despesas em PDF' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  async expensePdf(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Res() reply: FastifyReply,
  ) {
    const buffer = await this.generateExpenseReportPdfUseCase.execute(
      parseReportDateRange(dateFrom, dateTo),
    );

    return reply
      .type('application/pdf')
      .header('Content-Disposition', 'attachment; filename="relatorio-despesas.pdf"')
      .send(buffer);
  }

  @Get('series/daily-revenue')
  @ApiOperation({
    summary: 'Série diária de receita por forma de pagamento (para gráficos)',
  })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  @ApiOkResponse({ type: DailyRevenueSeriesPointPresenter, isArray: true })
  async dailyRevenueSeries(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ): Promise<DailyRevenueSeriesPointPresenter[]> {
    return await this.findDailyRevenueSeriesUseCase.execute(
      parseReportDateRange(dateFrom, dateTo),
    );
  }

  @Get('series/cost-comparison')
  @ApiOperation({
    summary:
      'Série diária comparando custo de produção, despesas e desperdício (para gráficos)',
  })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  @ApiOkResponse({ type: CostComparisonSeriesPointPresenter, isArray: true })
  async costComparisonSeries(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ): Promise<CostComparisonSeriesPointPresenter[]> {
    return await this.findCostComparisonSeriesUseCase.execute(
      parseReportDateRange(dateFrom, dateTo),
    );
  }

  @Get('series/payment-method-breakdown')
  @ApiOperation({
    summary: 'Receita total por forma de pagamento no período (para gráficos)',
  })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  @ApiOkResponse({ type: PaymentMethodBreakdownPresenter })
  async paymentMethodBreakdown(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ): Promise<PaymentMethodBreakdownPresenter> {
    return await this.findPaymentMethodBreakdownUseCase.execute(
      parseReportDateRange(dateFrom, dateTo),
    );
  }

  @Get('series/top-wasted-products')
  @ApiOperation({
    summary: 'Produtos com maior valor desperdiçado no período (para gráficos)',
  })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  @ApiOkResponse({ type: TopWastedProductPointPresenter, isArray: true })
  async topWastedProducts(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ): Promise<TopWastedProductPointPresenter[]> {
    return await this.findTopWastedProductsUseCase.execute(
      parseReportDateRange(dateFrom, dateTo),
    );
  }
}
