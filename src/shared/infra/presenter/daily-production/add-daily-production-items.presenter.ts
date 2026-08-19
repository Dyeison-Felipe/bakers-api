import { ApiProperty } from '@nestjs/swagger';

export class AddDailyProductionItemsPresenter {
  @ApiProperty({
    description: 'Ids dos itens de produção criados ou atualizados (somados)',
    type: [String],
  })
  readonly itemIds: string[];
}
