import { ApiProperty } from '@nestjs/swagger';
import { PermissionPresenter } from '../permission/permission.presenter';
import { RolePresenter } from '../role/role.presenter';

export class UserPresenter {
  @ApiProperty({ description: 'Id de identidicação do usuário', type: String })
  readonly id: string;

  @ApiProperty({ description: 'Username do usuário', type: String })
  readonly username: string;

  @ApiProperty({ description: 'Nome completo do usuário', type: String })
  readonly name: string;

  @ApiProperty({ description: 'E-mail do usuário', type: String })
  readonly email: string;

  @ApiProperty({ description: 'Cargo do usuário', type: RolePresenter })
  readonly role: RolePresenter;

  @ApiProperty({ description: 'Permissões do usuário', type: [PermissionPresenter] })
  readonly permissions: PermissionPresenter[];

  @ApiProperty({ description: 'Status do usuário', type: Boolean, required: false })
  readonly active?: boolean;

  constructor(props: UserPresenter) {
    this.id = props.id;
    this.username = props.username;
    this.name = props.name;
    this.email = props.email;
    this.role = props.role;
    this.permissions = props.permissions;
    this.active = props.active;
  }
}
