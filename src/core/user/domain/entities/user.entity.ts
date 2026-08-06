import { ID_USER_DEFAULT } from '@/shared/application/constants/id-user-default';
import { Data } from '@/shared/domain/decorators/data.decorator';
import { BaseEntity } from '@/shared/domain/entity/base-entity';
import { UserValidatorFactory } from '../validators/user-validator';
import { EntityValidationError } from '@/shared/application/errors/validation-error';
import { Role } from '@/core/role/domain/entities/role.entity';
import { Company } from '@/core/company/domain/entities/company.entity';
import { UserPermissionEntity } from '@/core/user-permission/domain/entities/user-permission.entity';

export type UserProps = {
  username: string;
  password: string;
  active: boolean;
  passwordResetCode?: string | null;
  expiredAtCode?: Date | null;
  email: string;
  role: Role;
  company: Company;
  createdBy: string;
  updatedBy: string;
  deletedBy?: string | null;
  userPermissions?: UserPermissionEntity[];
};

type CreateUserProps = {
  username: string;
  password: string;
  email: string;
  role: Role;
  company: Company;
  createdBy: string;
  updatedBy: string;
};

type UpdateUserProps = {
  username: string;
  email: string;
  role: Role;
  updatedBy: string;
};

type UpdatePassword = {
  password: string;
  updatedBy?: string;
};

export interface UserEntity extends UserProps {}

@Data()
export class UserEntity extends BaseEntity<UserProps> {
  static create(props: CreateUserProps): UserEntity {
    const entity = new UserEntity({
      id: crypto.randomUUID(),
      username: props.username,
      password: props.password,
      active: true,
      email: props.email,
      expiredAtCode: null,
      role: props.role,
      company: props.company,
      createdBy: props.createdBy ?? ID_USER_DEFAULT,
      updatedBy: props.updatedBy ?? ID_USER_DEFAULT,
    });

    return entity;
  }

  markAsDeletedBy(userId: string): void {
    this.deletedBy = userId;
  }

  update(props: UpdateUserProps): void {
    this.username = props.username;
    this.email = props.email;
    this.role = props.role;
    this.updatedBy = props.updatedBy;
    this.updateTimestamp();
  }

  updatePassword(props: UpdatePassword): void {
    this.password = props.password;
    if (props.updatedBy) {
      this.updatedBy = props.updatedBy;
      this.updateTimestamp();
    }
  }

  inativateUser(): void {
    this.active = false;
  }

  updateResetPasswordCode(code?: string): void {
    if (code) {
      this.passwordResetCode = code;
      this.expiredAtCode = new Date(Date.now() + 60 * 60 * 1000);
      return;
    }
    this.expiredAtCode = null;
    this.passwordResetCode = null;
  }

  protected validate() {
    const validator = UserValidatorFactory.create();

    const isValid = validator.validate(this.props);

    if (!isValid) {
      throw new EntityValidationError(validator.errors);
    }
  }
}
