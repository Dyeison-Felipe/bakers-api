import { ApiProperty } from '@nestjs/swagger';

export class AddDailyProductionItemPresenter {
  @ApiProperty({ description: 'Id do item de produção criado' })
  readonly id: string;
}
