import { ApiProperty } from '@nestjs/swagger';
import { PermissionPresenter } from '../permission/permission.presenter';

export class CreatePlanPresenter {
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
  @ApiProperty({ description: 'Limite de usuários do plano (null = ilimitado)' })
  readonly userLimit: number | null;
  @ApiProperty({ description: 'Permissões do plano' })
  readonly permissions: PermissionPresenter[];

  constructor(props: CreatePlanPresenter) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.price = props.price;
    this.duration = props.duration;
    this.userLimit = props.userLimit;
    this.permissions = props.permissions;
  }
}
