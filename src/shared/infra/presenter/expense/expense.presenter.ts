import { ApiProperty } from '@nestjs/swagger';

export class ExpensePresenter {
  @ApiProperty({ description: 'Id da despesa' })
  readonly id: string;

  @ApiProperty({ description: 'Data da despesa' })
  readonly date: Date;

  @ApiProperty({ description: 'Valor da despesa' })
  readonly value: number;

  @ApiProperty({ description: 'Descrição da despesa' })
  readonly description: string;

  constructor(props: ExpensePresenter) {
    this.id = props.id;
    this.date = props.date;
    this.value = props.value;
    this.description = props.description;
  }
}
