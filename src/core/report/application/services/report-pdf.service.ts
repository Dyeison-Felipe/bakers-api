import PDFDocument from 'pdfkit';
import { WasteReportOutput } from '@/shared/application/output/report/waste-report.output';
import { CashRegisterReportOutput } from '@/shared/application/output/report/cash-register-report.output';
import { ProductionReportOutput } from '@/shared/application/output/report/production-report.output';
import { ExpenseReportOutput } from '@/shared/application/output/report/expense-report.output';

type ReportCompany = {
  fantasyName: string;
  cnpj: string;
};

type ReportPeriod = {
  from: Date;
  to: Date;
};

type TableColumn = {
  label: string;
  width: number;
  align?: 'left' | 'right' | 'center';
};

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (date: Date) => date.toLocaleDateString('pt-BR');

const formatDateTime = (date: Date) => date.toLocaleString('pt-BR');

const PAGE_MARGIN = 40;
const ROW_HEIGHT = 18;

export class ReportPdfService {
  private static writeHeader(
    doc: PDFKit.PDFDocument,
    company: ReportCompany,
    title: string,
    period: ReportPeriod,
  ): void {
    doc
      .fontSize(16)
      .text(company.fantasyName, { align: 'left' })
      .fontSize(9)
      .fillColor('#666666')
      .text(`CNPJ: ${company.cnpj}`)
      .fillColor('#000000');

    doc.moveDown(0.5);
    doc.fontSize(14).text(title);
    doc
      .fontSize(9)
      .fillColor('#666666')
      .text(`Período: ${formatDate(period.from)} a ${formatDate(period.to)}`)
      .fillColor('#000000');

    doc.moveDown(1);
  }

  private static writeSummaryLine(
    doc: PDFKit.PDFDocument,
    label: string,
    value: string,
  ): void {
    doc.fontSize(10).text(`${label}: ${value}`);
  }

  private static drawTable(
    doc: PDFKit.PDFDocument,
    columns: TableColumn[],
    rows: string[][],
  ): void {
    const pageBottom = doc.page.height - doc.page.margins.bottom;
    const tableLeft = doc.page.margins.left;

    const drawRow = (values: string[], isHeader: boolean) => {
      if (doc.y + ROW_HEIGHT > pageBottom) {
        doc.addPage();
        doc.y = doc.page.margins.top;
      }

      let x = tableLeft;
      const y = doc.y;
      doc.fontSize(9).font(isHeader ? 'Helvetica-Bold' : 'Helvetica');

      values.forEach((value, index) => {
        const column = columns[index];
        doc.text(value, x, y, {
          width: column.width,
          align: column.align ?? 'left',
        });
        x += column.width;
      });

      doc.y = y + ROW_HEIGHT;
    };

    drawRow(
      columns.map((column) => column.label),
      true,
    );
    doc
      .moveTo(tableLeft, doc.y)
      .lineTo(
        tableLeft + columns.reduce((sum, column) => sum + column.width, 0),
        doc.y,
      )
      .strokeColor('#cccccc')
      .stroke();
    doc.moveDown(0.3);

    rows.forEach((row) => drawRow(row, false));
    doc.font('Helvetica');
  }

  private static toBuffer(
    build: (doc: PDFKit.PDFDocument) => void,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      build(doc);

      doc.end();
    });
  }

  static generateWasteReport(input: {
    company: ReportCompany;
    period: ReportPeriod;
    data: WasteReportOutput;
  }): Promise<Buffer> {
    return this.toBuffer((doc) => {
      this.writeHeader(doc, input.company, 'Relatório de Desperdício', input.period);

      this.writeSummaryLine(
        doc,
        'Valor total desperdiçado',
        formatCurrency(input.data.totalWaste),
      );
      this.writeSummaryLine(
        doc,
        'Recuperado ao custo (sobra vendida)',
        formatCurrency(input.data.totalRecoveredAtCost),
      );
      doc.moveDown(1);

      this.drawTable(
        doc,
        [
          { label: 'Data', width: 90 },
          { label: 'Produto', width: 200 },
          { label: 'Qtd.', width: 60, align: 'right' },
          { label: 'Valor', width: 90, align: 'right' },
        ],
        input.data.wasteItems.map((item) => [
          formatDateTime(item.date),
          item.productName,
          item.quantity.toString(),
          formatCurrency(item.totalCost),
        ]),
      );
    });
  }

  static generateCashRegisterReport(input: {
    company: ReportCompany;
    period: ReportPeriod;
    data: CashRegisterReportOutput;
  }): Promise<Buffer> {
    return this.toBuffer((doc) => {
      this.writeHeader(doc, input.company, 'Relatório de Caixa', input.period);

      const { summary } = input.data;
      this.writeSummaryLine(doc, 'Sessões de caixa', String(summary.sessionsCount));
      this.writeSummaryLine(
        doc,
        'Valor inicial total',
        formatCurrency(summary.totalOpeningAmount),
      );
      this.writeSummaryLine(doc, 'Vendas totais', formatCurrency(summary.totalSales));
      this.writeSummaryLine(
        doc,
        'Suprimentos',
        formatCurrency(summary.totalSupplies),
      );
      this.writeSummaryLine(
        doc,
        'Sangrias',
        formatCurrency(summary.totalWithdrawals),
      );
      this.writeSummaryLine(
        doc,
        'Despesas',
        formatCurrency(summary.totalExpenses),
      );
      this.writeSummaryLine(
        doc,
        'Desperdício',
        formatCurrency(summary.totalWaste),
      );
      this.writeSummaryLine(doc, 'Lucro total', formatCurrency(summary.totalProfit));
      doc.moveDown(1);

      this.drawTable(
        doc,
        [
          { label: 'Abertura', width: 90 },
          { label: 'Fechamento', width: 90 },
          { label: 'Inicial', width: 70, align: 'right' },
          { label: 'Vendas', width: 70, align: 'right' },
          { label: 'Suprim.', width: 65, align: 'right' },
          { label: 'Sangria', width: 65, align: 'right' },
          { label: 'Lucro', width: 65, align: 'right' },
        ],
        input.data.sessions.map((session) => [
          formatDateTime(session.openedAt),
          session.closedAt ? formatDateTime(session.closedAt) : 'Aberto',
          formatCurrency(session.openingAmount),
          formatCurrency(session.totalSales),
          formatCurrency(session.totalSupplies),
          formatCurrency(session.totalWithdrawals),
          formatCurrency(session.profit),
        ]),
      );
    });
  }

  static generateProductionReport(input: {
    company: ReportCompany;
    period: ReportPeriod;
    data: ProductionReportOutput;
  }): Promise<Buffer> {
    return this.toBuffer((doc) => {
      this.writeHeader(doc, input.company, 'Relatório de Produção', input.period);

      this.writeSummaryLine(
        doc,
        'Custo total de produção',
        formatCurrency(input.data.totalPlannedCost),
      );
      doc.moveDown(1);

      this.drawTable(
        doc,
        [
          { label: 'Data', width: 90 },
          { label: 'Produto', width: 220 },
          { label: 'Status', width: 90 },
          { label: 'Custo', width: 90, align: 'right' },
        ],
        input.data.items.map((item) => [
          formatDate(item.productionDate),
          item.productName,
          item.status,
          formatCurrency(item.plannedCost),
        ]),
      );
    });
  }

  static generateExpenseReport(input: {
    company: ReportCompany;
    period: ReportPeriod;
    data: ExpenseReportOutput;
  }): Promise<Buffer> {
    return this.toBuffer((doc) => {
      this.writeHeader(doc, input.company, 'Relatório de Despesas', input.period);

      this.writeSummaryLine(doc, 'Total de despesas', formatCurrency(input.data.total));
      doc.moveDown(1);

      this.drawTable(
        doc,
        [
          { label: 'Data', width: 90 },
          { label: 'Descrição', width: 300 },
          { label: 'Valor', width: 90, align: 'right' },
        ],
        input.data.items.map((item) => [
          formatDate(item.date),
          item.description,
          formatCurrency(item.value),
        ]),
      );
    });
  }
}
