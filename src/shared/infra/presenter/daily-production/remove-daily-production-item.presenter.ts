import { ApiProperty } from '@nestjs/swagger';

export class RemoveDailyProductionItemPresenter {
  @ApiProperty({ description: 'Id do item removido' })
  readonly id: string;
}
