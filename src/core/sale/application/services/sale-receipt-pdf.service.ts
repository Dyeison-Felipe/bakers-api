import PDFDocument from 'pdfkit';
import { TypePaymentMethod } from '@/shared/infra/enums/sale';

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

export class SaleReceiptPdfService {
  static generate(input: GenerateInput): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: [227, 700], margin: 12 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const { company, sale, items } = input;

      doc
        .fontSize(11)
        .text(company.fantasyName, { align: 'center' })
        .fontSize(8)
        .text(`CNPJ: ${company.cnpj}`, { align: 'center' });

      if (company.address) {
        doc.text(company.address, { align: 'center' });
      }

      doc.moveDown(0.5);
      doc.text('-'.repeat(40));
      doc.text(
        `${sale.createdAt.toLocaleString('pt-BR')}    Venda #${sale.id.slice(0, 8)}`,
      );
      doc.text('-'.repeat(40));

      items.forEach((item) => {
        const detail =
          item.weightInKg != null
            ? `${item.weightInKg.toFixed(3)}kg x ${formatCurrency(item.unitPrice)}/kg`
            : `${item.quantity}x ${formatCurrency(item.unitPrice)}`;

        doc.text(item.name);
        doc.text(`  ${detail}  =  ${formatCurrency(item.subtotal)}`);
      });

      doc.text('-'.repeat(40));
      doc.fontSize(10).text(`TOTAL: ${formatCurrency(sale.totalAmount)}`);
      doc
        .fontSize(8)
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

      doc.text('-'.repeat(40));
      doc
        .fontSize(7)
        .text('DOCUMENTO SEM VALOR FISCAL', { align: 'center' })
        .text('Simulação gerada por Baker\'s Bill', { align: 'center' });

      doc.end();
    });
  }
}
