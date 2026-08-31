import { ApiProperty } from "@nestjs/swagger";

export class PlanPresenter {

  @ApiProperty({ description: 'Id do plano' })
  readonly id: string;
  @ApiProperty({ description: 'Nome do plano' })
  readonly name: string;
  @ApiProperty({ description: 'Descrição do plano' })
  readonly description: string;
  @ApiProperty({ description: 'Preço do plano' })
  readonly price: number;
  @ApiProperty({ description: 'Duração do plano' })
  readonly duration: number;

  constructor(props: PlanPresenter) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.price = props.price;
    this.duration = props.duration;
  }
}