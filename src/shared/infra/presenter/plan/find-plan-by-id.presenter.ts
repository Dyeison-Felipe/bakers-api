import { ApiProperty } from '@nestjs/swagger';
import { PermissionPresenter } from '../permission/permission.presenter';

export class FindPlanByIdPresenter {
  @ApiProperty({ description: 'Id do plano' })
  readonly id: string;
  @ApiProperty({ description: 'Nome do plano' })
  readonly name: string;
  @ApiProperty({ description: 'Descrição do plano' })
  readonly description: string;
  @ApiProperty({ description: 'Preço do plano' })
  readonly price: number;
  @ApiProperty({ description: 'Se o plano está ativo' })
  readonly active: boolean;
  @ApiProperty({ description: 'Duração do plano' })
  readonly duration: number;
  @ApiProperty({ description: 'Limite de usuários do plano (null = ilimitado)' })
  readonly userLimit: number | null;
  @ApiProperty({ description: 'Permissões do plano' })
  readonly permissions: PermissionPresenter[];

  constructor(props: FindPlanByIdPresenter) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.price = props.price;
    this.active = props.active;
    this.duration = props.duration;
    this.userLimit = props.userLimit;
    this.permissions = props.permissions;
  }
}
