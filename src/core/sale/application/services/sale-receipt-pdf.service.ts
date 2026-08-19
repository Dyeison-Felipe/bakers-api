import PDFDocument from 'pdfkit';
import { TypePaymentMethod } from '@/shared/infra/enums/sale';
import { LOGO_PATH } from '@/shared/infra/pdf/pdf-assets';

type ReceiptCompany = {
  fantasyName: string;
  cnpj: string;
  address: string | null;
};

type ReceiptSale = {
  id: string;
  createdAt: Date;
  paymentMethod: TypePaymentMethod;
  totalAmount: number;
  amountReceived: number | null;
  changeAmount: number | null;
  customerCpf: string | null;
};

type ReceiptItem = {
  name: string;
  quantity: number | null;
  weightInKg: number | null;
  unitPrice: number;
  subtotal: number;
};

type GenerateInput = {
  company: ReceiptCompany;
  sale: ReceiptSale;
  items: ReceiptItem[];
};

const paymentMethodLabel: Record<TypePaymentMethod, string> = {
  [TypePaymentMethod.PIX]: 'Pix',
  [TypePaymentMethod.CARD]: 'Cartão',
  [TypePaymentMethod.CASH]: 'Dinheiro',
};

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const PAGE_WIDTH = 227;
const MARGIN = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const INK = '#1f1f1f';
const MUTED = '#6b6b6b';

// Recibo em formato de bobina térmica (largura fixa ~80mm) — a altura é
// estimada a partir da quantidade de itens pra não sobrar/faltar papel em
// branco, já que o pdfkit não suporta altura "automática" nativamente.
const estimatePageHeight = (input: GenerateInput): number => {
  const base = 245;
  const perItem = 30;
  const addressExtra = input.company.address ? 12 : 0;
  const cashExtra = input.sale.paymentMethod === TypePaymentMethod.CASH ? 32 : 0;
  const cpfExtra = input.sale.customerCpf ? 16 : 0;

  return base + input.items.length * perItem + addressExtra + cashExtra + cpfExtra;
};

const divider = (doc: PDFKit.PDFDocument) => {
  doc
    .moveTo(MARGIN, doc.y)
    .lineTo(PAGE_WIDTH - MARGIN, doc.y)
    .dash(1, { space: 1.5 })
    .strokeColor('#b0b0b0')
    .stroke()
    .undash();
  doc.moveDown(0.5);
};

export class SaleReceiptPdfService {
  static generate(input: GenerateInput): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: [PAGE_WIDTH, estimatePageHeight(input)],
        margin: MARGIN,
      });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const { company, sale, items } = input;

      doc.fillColor(INK);

      doc.image(LOGO_PATH, (PAGE_WIDTH - 90) / 2, doc.y, { width: 90 });
      doc.y += 52;
      doc.moveDown(0.6);

      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(company.fantasyName, { align: 'center' })
        .font('Helvetica')
        .fontSize(8)
        .fillColor(MUTED)
        .text(`CNPJ: ${company.cnpj}`, { align: 'center' });

      if (company.address) {
        doc.text(company.address, { align: 'center' });
      }

      doc.fillColor(INK);
      doc.moveDown(0.6);
      divider(doc);

      const metaY = doc.y;
      doc
        .fontSize(8)
        .fillColor(MUTED)
        .text(sale.createdAt.toLocaleString('pt-BR'), MARGIN, metaY, {
          width: CONTENT_WIDTH / 2,
          align: 'left',
        });
      doc
        .fontSize(8)
        .fillColor(MUTED)
        .text(`Venda #${sale.id.slice(0, 8).toUpperCase()}`, MARGIN, metaY, {
          width: CONTENT_WIDTH,
          align: 'right',
        });
      doc.fillColor(INK);
      doc.y = metaY + 12;
      doc.moveDown(0.4);
      divider(doc);

      items.forEach((item, index) => {
        const detail =
          item.weightInKg != null
            ? `${item.weightInKg.toFixed(3)}kg x ${formatCurrency(item.unitPrice)}/kg`
            : `${item.quantity}x ${formatCurrency(item.unitPrice)}`;

        doc.font('Helvetica-Bold').fontSize(9).text(item.name, { width: CONTENT_WIDTH });

        const detailY = doc.y;
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor(MUTED)
          .text(detail, MARGIN, detailY, { width: CONTENT_WIDTH * 0.6, align: 'left' });
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor(INK)
          .text(formatCurrency(item.subtotal), MARGIN, detailY, {
            width: CONTENT_WIDTH,
            align: 'right',
          });

        if (index < items.length - 1) doc.moveDown(0.5);
      });

      doc.moveDown(0.6);
      divider(doc);

      const totalY = doc.y;
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('TOTAL', MARGIN, totalY, { width: CONTENT_WIDTH / 2, align: 'left' });
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(formatCurrency(sale.totalAmount), MARGIN, totalY, {
          width: CONTENT_WIDTH,
          align: 'right',
        });
      doc.y = totalY + 16;

      doc.moveDown(0.5);
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(MUTED)
        .text(`Forma de pagamento: ${paymentMethodLabel[sale.paymentMethod]}`);

      if (sale.paymentMethod === TypePaymentMethod.CASH) {
        doc.text(`Valor recebido: ${formatCurrency(sale.amountReceived ?? 0)}`);
        doc.text(`Troco: ${formatCurrency(sale.changeAmount ?? 0)}`);
      }

      if (sale.customerCpf) {
        const cpf = sale.customerCpf;
        doc.text(
          `CPF do cliente: ${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9, 11)}`,
        );
      }

      doc.fillColor(INK);
      doc.moveDown(0.8);
      divider(doc);

      doc
        .font('Helvetica-Oblique')
        .fontSize(7)
        .fillColor(MUTED)
        .text('DOCUMENTO SEM VALOR FISCAL', { align: 'center' })
        .text("Gerado por Baker's Bill", { align: 'center' });

      doc.end();
    });
  }
}
