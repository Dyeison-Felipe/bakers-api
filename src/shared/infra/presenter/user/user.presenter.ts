import { ApiProperty } from '@nestjs/swagger';
import { PermissionPresenter } from '../permission/permission.presenter';
import { RolePresenter } from '../role/role.presenter';
import { CompanyPresenter } from '../company/company-presenter';

export class UserPresenter {
  @ApiProperty({ description: 'Id de identidicação do usuário', type: String })
  readonly id: string;

  // @ApiProperty({ description: 'Username do usuário', type: String })
  // readonly username: string;

  // @ApiProperty({ description: 'E-mail do usuário', type: String })
  // readonly email: string;

  // @ApiProperty({ description: 'Permissões do usuário', type: String })
  // readonly permissions?: PermissionPresenter[];

  // @ApiProperty({ description: 'Cargo do usuário', type: String })
  // readonly role: RolePresenter;

  // @ApiProperty({ description: 'Empresa pertencente ao usuário', type: String })
  // readonly company: CompanyPresenter;

  constructor(props: UserPresenter) {
    this.id = props.id;
    // this.username = props.username;
    // this.email = props.email;
    // this.permissions = props.permissions;
    // this.company = props.company;
    // this.role = props.role
  }
}
