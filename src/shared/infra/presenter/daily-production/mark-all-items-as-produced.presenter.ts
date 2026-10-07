import { ApiProperty } from '@nestjs/swagger';

export class MarkAllItemsAsProducedFailurePresenter {
  @ApiProperty({ description: 'Id do item que não pôde ser concluído' })
  readonly itemId: string;

  @ApiProperty({ description: 'Nome do produto do item' })
  readonly productName: string;

  @ApiProperty({
    description: 'Motivo da falha (ex.: estoque insuficiente de um insumo)',
  })
  readonly reason: string;
}

export class MarkAllItemsAsProducedPresenter {
  @ApiProperty({
    description: 'Ids dos itens de produção marcados como produzidos',
    type: [String],
  })
  readonly itemIds: string[];

  @ApiProperty({
    description:
      'Itens que não puderam ser concluídos (continuam aguardando produção), com o motivo',
    type: [MarkAllItemsAsProducedFailurePresenter],
  })
  readonly failures: MarkAllItemsAsProducedFailurePresenter[];
}
