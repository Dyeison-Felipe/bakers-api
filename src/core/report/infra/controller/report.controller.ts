import { Controller, Get, Query, Res } from '@nestjs/common';
import { TypeProduct } from '@/shared/infra/enums/product';
import { FastifyReply } from 'fastify';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Permission } from '@/shared/infra/decorators/permission.decorator';
import { PermissionReport } from '@/core/auth/domain/permissions-definition/report';
import { parseDateOnly } from '@/shared/infra/utils/parse-date-only';
import { WasteReportPresenter } from '@/shared/infra/presenter/report/waste-report.presenter';
import { CashRegisterReportPresenter } from '@/shared/infra/presenter/report/cash-register-report.presenter';
import { ProductionReportPresenter } from '@/shared/infra/presenter/report/production-report.presenter';
import { ExpenseReportPresenter } from '@/shared/infra/presenter/report/expense-report.presenter';
import { CpvReportPresenter } from '@/shared/infra/presenter/report/cpv-report.presenter';
import { ContributionMarginReportPresenter } from '@/shared/infra/presenter/report/contribution-margin-report.presenter';
import { AbcCurveReportPresenter } from '@/shared/infra/presenter/report/abc-curve-report.presenter';
import { FindWasteReportUseCase } from '../../application/usecase/find-waste-report.usecase';
import { FindCashRegisterReportUseCase } from '../../application/usecase/find-cash-register-report.usecase';
import { FindProductionReportUseCase } from '../../application/usecase/find-production-report.usecase';
import { FindExpenseReportUseCase } from '../../application/usecase/find-expense-report.usecase';
import { GenerateWasteReportPdfUseCase } from '../../application/usecase/generate-waste-report-pdf.usecase';
import { GenerateCashRegisterReportPdfUseCase } from '../../application/usecase/generate-cash-register-report-pdf.usecase';
import { GenerateProductionReportPdfUseCase } from '../../application/usecase/generate-production-report-pdf.usecase';
import { GenerateExpenseReportPdfUseCase } from '../../application/usecase/generate-expense-report-pdf.usecase';
import { FindCpvReportUseCase } from '../../application/usecase/find-cpv-report.usecase';
import { FindContributionMarginReportUseCase } from '../../application/usecase/find-contribution-margin-report.usecase';
import { FindAbcCurveReportUseCase } from '../../application/usecase/find-abc-curve-report.usecase';
import { GenerateCpvReportPdfUseCase } from '../../application/usecase/generate-cpv-report-pdf.usecase';
import { GenerateContributionMarginReportPdfUseCase } from '../../application/usecase/generate-contribution-margin-report-pdf.usecase';
import { GenerateAbcCurveReportPdfUseCase } from '../../application/usecase/generate-abc-curve-report-pdf.usecase';

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
    private readonly generateWasteReportPdfUseCase: GenerateWasteReportPdfUseCase,
    private readonly generateCashRegisterReportPdfUseCase: GenerateCashRegisterReportPdfUseCase,
    private readonly generateProductionReportPdfUseCase: GenerateProductionReportPdfUseCase,
    private readonly generateExpenseReportPdfUseCase: GenerateExpenseReportPdfUseCase,
    private readonly findCpvReportUseCase: FindCpvReportUseCase,
    private readonly findContributionMarginReportUseCase: FindContributionMarginReportUseCase,
    private readonly findAbcCurveReportUseCase: FindAbcCurveReportUseCase,
    private readonly generateCpvReportPdfUseCase: GenerateCpvReportPdfUseCase,
    private readonly generateContributionMarginReportPdfUseCase: GenerateContributionMarginReportPdfUseCase,
    private readonly generateAbcCurveReportPdfUseCase: GenerateAbcCurveReportPdfUseCase,
  ) {}

  @Get('waste')
  @Permission(PermissionReport.REPORT_WASTE_READER)
  @ApiOperation({ summary: 'Relatório de desperdício por período' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'typeProduct', required: false, enum: TypeProduct })
  @ApiOkResponse({ type: WasteReportPresenter })
  async waste(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('productId') productId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('typeProduct') typeProduct?: TypeProduct,
  ): Promise<WasteReportPresenter> {
    return await this.findWasteReportUseCase.execute({
      ...parseReportDateRange(dateFrom, dateTo),
      productId,
      categoryId,
      typeProduct,
    });
  }

  @Get('waste/pdf')
  @Permission(PermissionReport.REPORT_WASTE_READER)
  @ApiOperation({ summary: 'Exporta o relatório de desperdício em PDF' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'typeProduct', required: false, enum: TypeProduct })
  async wastePdf(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('productId') productId: string | undefined,
    @Query('categoryId') categoryId: string | undefined,
    @Query('typeProduct') typeProduct: TypeProduct | undefined,
    @Res() reply: FastifyReply,
  ) {
    const buffer = await this.generateWasteReportPdfUseCase.execute({
      ...parseReportDateRange(dateFrom, dateTo),
      productId,
      categoryId,
      typeProduct,
    });

    return reply
      .type('application/pdf')
      .header('Content-Disposition', 'attachment; filename="relatorio-desperdicio.pdf"')
      .send(buffer);
  }

  @Get('cash-register')
  @Permission(PermissionReport.REPORT_CASH_REGISTER_READER)
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
  @Permission(PermissionReport.REPORT_CASH_REGISTER_READER)
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
  @Permission(PermissionReport.REPORT_PRODUCTION_READER)
  @ApiOperation({ summary: 'Relatório de custo de produção por período' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'typeProduct', required: false, enum: TypeProduct })
  @ApiOkResponse({ type: ProductionReportPresenter })
  async production(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('productId') productId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('typeProduct') typeProduct?: TypeProduct,
  ): Promise<ProductionReportPresenter> {
    return await this.findProductionReportUseCase.execute({
      ...parseReportDateRange(dateFrom, dateTo),
      productId,
      categoryId,
      typeProduct,
    });
  }

  @Get('production/pdf')
  @Permission(PermissionReport.REPORT_PRODUCTION_READER)
  @ApiOperation({ summary: 'Exporta o relatório de produção em PDF' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'typeProduct', required: false, enum: TypeProduct })
  async productionPdf(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('productId') productId: string | undefined,
    @Query('categoryId') categoryId: string | undefined,
    @Query('typeProduct') typeProduct: TypeProduct | undefined,
    @Res() reply: FastifyReply,
  ) {
    const buffer = await this.generateProductionReportPdfUseCase.execute({
      ...parseReportDateRange(dateFrom, dateTo),
      productId,
      categoryId,
      typeProduct,
    });

    return reply
      .type('application/pdf')
      .header('Content-Disposition', 'attachment; filename="relatorio-producao.pdf"')
      .send(buffer);
  }

  @Get('expense')
  @Permission(PermissionReport.REPORT_EXPENSE_READER)
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
  @Permission(PermissionReport.REPORT_EXPENSE_READER)
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

  @Get('cpv')
  @Permission(PermissionReport.REPORT_CPV_READER)
  @ApiOperation({ summary: 'Relatório de CPV (Custo dos Produtos Vendidos) por período' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'typeProduct', required: false, enum: TypeProduct })
  @ApiOkResponse({ type: CpvReportPresenter })
  async cpv(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('productId') productId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('typeProduct') typeProduct?: TypeProduct,
  ): Promise<CpvReportPresenter> {
    return await this.findCpvReportUseCase.execute({
      ...parseReportDateRange(dateFrom, dateTo),
      productId,
      categoryId,
      typeProduct,
    });
  }

  @Get('cpv/pdf')
  @Permission(PermissionReport.REPORT_CPV_READER)
  @ApiOperation({ summary: 'Exporta o relatório de CPV em PDF' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'typeProduct', required: false, enum: TypeProduct })
  async cpvPdf(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('productId') productId: string | undefined,
    @Query('categoryId') categoryId: string | undefined,
    @Query('typeProduct') typeProduct: TypeProduct | undefined,
    @Res() reply: FastifyReply,
  ) {
    const buffer = await this.generateCpvReportPdfUseCase.execute({
      ...parseReportDateRange(dateFrom, dateTo),
      productId,
      categoryId,
      typeProduct,
    });

    return reply
      .type('application/pdf')
      .header('Content-Disposition', 'attachment; filename="relatorio-cpv.pdf"')
      .send(buffer);
  }

  @Get('contribution-margin')
  @Permission(PermissionReport.REPORT_CONTRIBUTION_MARGIN_READER)
  @ApiOperation({ summary: 'Relatório de Margem de Contribuição por produto no período' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'typeProduct', required: false, enum: TypeProduct })
  @ApiOkResponse({ type: ContributionMarginReportPresenter })
  async contributionMargin(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('productId') productId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('typeProduct') typeProduct?: TypeProduct,
  ): Promise<ContributionMarginReportPresenter> {
    return await this.findContributionMarginReportUseCase.execute({
      ...parseReportDateRange(dateFrom, dateTo),
      productId,
      categoryId,
      typeProduct,
    });
  }

  @Get('contribution-margin/pdf')
  @Permission(PermissionReport.REPORT_CONTRIBUTION_MARGIN_READER)
  @ApiOperation({ summary: 'Exporta o relatório de Margem de Contribuição em PDF' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'typeProduct', required: false, enum: TypeProduct })
  async contributionMarginPdf(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('productId') productId: string | undefined,
    @Query('categoryId') categoryId: string | undefined,
    @Query('typeProduct') typeProduct: TypeProduct | undefined,
    @Res() reply: FastifyReply,
  ) {
    const buffer = await this.generateContributionMarginReportPdfUseCase.execute({
      ...parseReportDateRange(dateFrom, dateTo),
      productId,
      categoryId,
      typeProduct,
    });

    return reply
      .type('application/pdf')
      .header('Content-Disposition', 'attachment; filename="relatorio-margem-contribuicao.pdf"')
      .send(buffer);
  }

  @Get('abc-curve')
  @Permission(PermissionReport.REPORT_ABC_CURVE_READER)
  @ApiOperation({ summary: 'Relatório de Curva ABC de produtos por receita no período' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'typeProduct', required: false, enum: TypeProduct })
  @ApiOkResponse({ type: AbcCurveReportPresenter })
  async abcCurve(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('productId') productId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('typeProduct') typeProduct?: TypeProduct,
  ): Promise<AbcCurveReportPresenter> {
    return await this.findAbcCurveReportUseCase.execute({
      ...parseReportDateRange(dateFrom, dateTo),
      productId,
      categoryId,
      typeProduct,
    });
  }

  @Get('abc-curve/pdf')
  @Permission(PermissionReport.REPORT_ABC_CURVE_READER)
  @ApiOperation({ summary: 'Exporta o relatório de Curva ABC em PDF' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'typeProduct', required: false, enum: TypeProduct })
  async abcCurvePdf(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('productId') productId: string | undefined,
    @Query('categoryId') categoryId: string | undefined,
    @Query('typeProduct') typeProduct: TypeProduct | undefined,
    @Res() reply: FastifyReply,
  ) {
    const buffer = await this.generateAbcCurveReportPdfUseCase.execute({
      ...parseReportDateRange(dateFrom, dateTo),
      productId,
      categoryId,
      typeProduct,
    });

    return reply
      .type('application/pdf')
      .header('Content-Disposition', 'attachment; filename="relatorio-curva-abc.pdf"')
      .send(buffer);
  }
}
