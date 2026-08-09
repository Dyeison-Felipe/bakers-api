import { ApiProperty } from '@nestjs/swagger';
import { RolePresenter } from '../role/role.presenter';

export class FindAllUsersPresenter {
  @ApiProperty({ description: 'Id de identidicação do usuário', type: String })
  readonly id: string;

  @ApiProperty({ description: 'Username do usuário', type: String })
  readonly username: string;

  @ApiProperty({ description: 'Nome completo do usuário', type: String })
  readonly name: string;

  @ApiProperty({ description: 'E-mail do usuário', type: String })
  readonly email: string;

  @ApiProperty({ description: 'Status do usuário', type: Boolean })
  readonly active: boolean;

  @ApiProperty({ description: 'Cargo do usuário', type: RolePresenter })
  readonly role: RolePresenter;

  constructor(props: FindAllUsersPresenter) {
    this.id = props.id;
    this.username = props.username;
    this.name = props.name;
    this.email = props.email;
    this.active = props.active;
    this.role = props.role;
  }
}
