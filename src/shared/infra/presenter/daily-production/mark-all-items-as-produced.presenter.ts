import { ApiProperty } from '@nestjs/swagger';

export class MarkAllItemsAsProducedPresenter {
  @ApiProperty({
    description: 'Ids dos itens de produção marcados como produzidos',
    type: [String],
  })
  readonly itemIds: string[];
}
