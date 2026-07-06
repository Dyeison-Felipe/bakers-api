import { Company } from '@/core/company/domain/entities/company.entity';
import { ID_USER_DEFAULT } from '@/shared/application/constants/id-user-default';
import { EntityValidationError } from '@/shared/application/errors/validation-error';
import { Data } from '@/shared/domain/decorators/data.decorator';
import { BaseEntity } from '@/shared/domain/entity/base-entity';
import { RoleValidatorFactory } from '../validators/role-validators';

export type RoleProps = {
  name: string;
  company?: Company | null;
  createdBy: string;
  updatedBy: string;
  deletedBy?: string | null;
};

type CreateRoleProps = {
  name: string;
  company: Company;
  createdBy: string;
  updatedBy: string;
  deletedBy?: string | null;
};

export interface Role extends RoleProps {}

@Data()
export class Role extends BaseEntity<RoleProps> {
  static create(props: CreateRoleProps): Role {
    const role = new Role({
      id: crypto.randomUUID(),
      name: props.name,
      company: props.company,
      createdBy: props.createdBy ?? ID_USER_DEFAULT,
      updatedBy: props.updatedBy ?? ID_USER_DEFAULT,
      deletedBy: props.deletedBy,
    });

    return role;
  }

  protected validate(): void {
    const validator = RoleValidatorFactory.create();

    const isValid = validator.validate(this.props);
    if (!isValid) {
      throw new EntityValidationError(validator.errors);
    }
  }
}
