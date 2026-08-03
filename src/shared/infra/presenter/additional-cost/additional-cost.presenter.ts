import { ApiProperty } from '@nestjs/swagger';

export class AdditionalCostPresenter {
  @ApiProperty({ description: 'Id do gasto adicional' })
  readonly id: string;
  readonly name?: string;

  constructor(props: AdditionalCostPresenter) {
    this.id = props.id;
    this.name = props.name;
  }
}
