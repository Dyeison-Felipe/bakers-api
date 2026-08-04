import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FinalizeSalePresenter {
  @ApiProperty({ description: 'Id da venda criada' })
  readonly id: string;

  @ApiProperty({ description: 'Valor total da venda' })
  readonly totalAmount: number;

  @ApiPropertyOptional({ description: 'Valor recebido do cliente (se dinheiro)' })
  readonly amountReceived: number | null;

  @ApiPropertyOptional({ description: 'Troco devolvido ao cliente (se dinheiro)' })
  readonly changeAmount: number | null;

  @ApiPropertyOptional({ description: 'URL para baixar o cupom em PDF, se gerado' })
  readonly receiptPdfUrl?: string;
}
