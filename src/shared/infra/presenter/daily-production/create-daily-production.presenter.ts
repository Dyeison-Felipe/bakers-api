import { ApiProperty } from '@nestjs/swagger';

export class CreateDailyProductionPresenter {
  @ApiProperty({ description: 'Id da produção diária criada' })
  readonly id: string;
}
