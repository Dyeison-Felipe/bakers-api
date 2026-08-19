import PDFDocument from 'pdfkit';
import { WasteReportOutput } from '@/shared/application/output/report/waste-report.output';
import { CashRegisterReportOutput } from '@/shared/application/output/report/cash-register-report.output';
import { ProductionReportOutput } from '@/shared/application/output/report/production-report.output';
import { ExpenseReportOutput } from '@/shared/application/output/report/expense-report.output';
import { TypeDailyProductionItemStatus } from '@/shared/infra/enums/daily-production';
import { LOGO_PATH } from '@/shared/infra/pdf/pdf-assets';

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
  /** Peso relativo da coluna — as larguras são distribuídas proporcionalmente
   * até preencher 100% da largura útil da página, não um valor em pontos. */
  flex: number;
  align?: 'left' | 'right' | 'center';
};

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (date: Date) => date.toLocaleDateString('pt-BR');

const formatDateTime = (date: Date) => date.toLocaleString('pt-BR');

const productionStatusLabel: Record<TypeDailyProductionItemStatus, string> = {
  [TypeDailyProductionItemStatus.PLANNED]: 'Planejado',
  [TypeDailyProductionItemStatus.PRODUCED]: 'Produzido',
  [TypeDailyProductionItemStatus.CANCELLED]: 'Cancelado',
};

const PAGE_MARGIN = 40;
const ROW_HEIGHT = 22;
const FOOTER_RESERVE = 28;
const INK = '#1f1f1f';
const MUTED = '#6b6b6b';
const ACCENT = '#3f4a3f';
const ZEBRA = '#f4f5f4';
const RULE = '#dcdcdc';

export class ReportPdfService {
  private static contentWidth(doc: PDFKit.PDFDocument): number {
    return doc.page.width - doc.page.margins.left - doc.page.margins.right;
  }

  private static writeHeader(
    doc: PDFKit.PDFDocument,
    company: ReportCompany,
    title: string,
    period: ReportPeriod,
  ): void {
    const left = doc.page.margins.left;
    const width = this.contentWidth(doc);
    const logoWidth = 44;
    const textX = left + logoWidth + 14;

    doc.image(LOGO_PATH, left, doc.y, { width: logoWidth });

    const headerTop = doc.y;
    doc
      .font('Helvetica-Bold')
      .fontSize(15)
      .fillColor(INK)
      .text(company.fantasyName, textX, headerTop, { width: width - logoWidth - 14 });
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(MUTED)
      .text(`CNPJ: ${company.cnpj}`, textX, doc.y, { width: width - logoWidth - 14 });

    doc.y = Math.max(doc.y, headerTop + logoWidth * (172 / 305));
    doc.fillColor(INK);
    doc.y += 14;

    const bandY = doc.y;
    const bandHeight = 26;
    doc.rect(left, bandY, width, bandHeight).fill(ACCENT);
    doc
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .fontSize(13)
      .text(title, left + 12, bandY + 7, { width: width - 24 });
    doc.fillColor(INK);
    doc.y = bandY + bandHeight + 8;

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(MUTED)
      .text(`Período: ${formatDate(period.from)} a ${formatDate(period.to)}`, left, doc.y, {
        width,
      });
    doc.fillColor(INK);
    doc.y += 18;
  }

  private static writeSummaryLine(
    doc: PDFKit.PDFDocument,
    label: string,
    value: string,
  ): void {
    const left = doc.page.margins.left;
    const width = this.contentWidth(doc);
    const y = doc.y;

    doc.font('Helvetica').fontSize(9.5).fillColor(MUTED).text(label, left, y, { width: width * 0.6 });
    doc
      .font('Helvetica-Bold')
      .fontSize(10.5)
      .fillColor(INK)
      .text(value, left, y, { width, align: 'right' });

    doc.y = y + 16;
  }

  private static drawTable(
    doc: PDFKit.PDFDocument,
    columns: TableColumn[],
    rows: string[][],
  ): void {
    const tableLeft = doc.page.margins.left;
    const tableWidth = this.contentWidth(doc);
    const totalFlex = columns.reduce((sum, column) => sum + column.flex, 0);
    const columnWidths = columns.map((column) => (column.flex / totalFlex) * tableWidth);
    const pageBottom = () => doc.page.height - doc.page.margins.bottom - FOOTER_RESERVE;

    const drawCells = (values: string[], y: number) => {
      let x = tableLeft;
      values.forEach((value, index) => {
        const width = columnWidths[index];
        doc.text(value, x + 5, y + 6, {
          width: width - 10,
          align: columns[index].align ?? 'left',
          ellipsis: true,
        });
        x += width;
      });
    };

    const drawHeaderRow = () => {
      const y = doc.y;
      doc.rect(tableLeft, y, tableWidth, ROW_HEIGHT).fill(ACCENT);
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
      drawCells(
        columns.map((column) => column.label),
        y,
      );
      doc.fillColor(INK);
      doc.y = y + ROW_HEIGHT;
    };

    const drawDataRow = (values: string[], rowIndex: number) => {
      if (doc.y + ROW_HEIGHT > pageBottom()) {
        doc.addPage();
        doc.y = doc.page.margins.top;
        drawHeaderRow();
      }

      const y = doc.y;
      if (rowIndex % 2 === 1) {
        doc.rect(tableLeft, y, tableWidth, ROW_HEIGHT).fill(ZEBRA);
      }
      doc.font('Helvetica').fontSize(9).fillColor(INK);
      drawCells(values, y);
      doc.y = y + ROW_HEIGHT;
    };

    drawHeaderRow();

    if (rows.length === 0) {
      doc
        .font('Helvetica-Oblique')
        .fontSize(9)
        .fillColor(MUTED)
        .text('Nenhum registro encontrado no período.', tableLeft + 5, doc.y + 8, {
          width: tableWidth - 10,
        });
      doc.fillColor(INK);
      doc.y += 30;
    } else {
      rows.forEach((row, index) => drawDataRow(row, index));
    }

    doc
      .moveTo(tableLeft, doc.y)
      .lineTo(tableLeft + tableWidth, doc.y)
      .strokeColor(RULE)
      .stroke();
  }

  private static writeFooters(doc: PDFKit.PDFDocument): void {
    const range = doc.bufferedPageRange();
    const generatedAt = new Date().toLocaleString('pt-BR');

    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);

      const left = doc.page.margins.left;
      const right = doc.page.width - doc.page.margins.right;
      // Fica dentro da margem inferior (não abaixo dela) — escrever texto
      // além do limite da margem faz o pdfkit inserir uma página em branco
      // automaticamente pra "continuar" o conteúdo que "não coube".
      const bottomBoundary = doc.page.height - doc.page.margins.bottom;
      const lineY = bottomBoundary - 18;
      const textY = bottomBoundary - 12;

      doc.moveTo(left, lineY).lineTo(right, lineY).strokeColor(RULE).stroke();

      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(MUTED)
        .text(`Gerado por Baker's Bill em ${generatedAt}`, left, textY, {
          width: (right - left) / 2,
          lineBreak: false,
        });
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(MUTED)
        .text(`Página ${i - range.start + 1} de ${range.count}`, left, textY, {
          width: right - left,
          align: 'right',
          lineBreak: false,
        });
    }
  }

  private static toBuffer(
    build: (doc: PDFKit.PDFDocument) => void,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN, bufferPages: true });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      build(doc);
      this.writeFooters(doc);

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
          { label: 'Data', flex: 2 },
          { label: 'Produto', flex: 4 },
          { label: 'Qtd.', flex: 1, align: 'right' },
          { label: 'Valor', flex: 2, align: 'right' },
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
          { label: 'Abertura', flex: 2 },
          { label: 'Fechamento', flex: 2 },
          { label: 'Inicial', flex: 1, align: 'right' },
          { label: 'Vendas', flex: 1, align: 'right' },
          { label: 'Suprim.', flex: 1, align: 'right' },
          { label: 'Sangria', flex: 1, align: 'right' },
          { label: 'Lucro', flex: 1, align: 'right' },
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
          { label: 'Data', flex: 2 },
          { label: 'Produto', flex: 4 },
          { label: 'Status', flex: 1.5 },
          { label: 'Custo', flex: 2, align: 'right' },
        ],
        input.data.items.map((item) => [
          formatDate(item.productionDate),
          item.productName,
          productionStatusLabel[item.status],
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
          { label: 'Data', flex: 2 },
          { label: 'Descrição', flex: 5 },
          { label: 'Valor', flex: 2, align: 'right' },
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
