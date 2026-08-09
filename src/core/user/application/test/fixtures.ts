import { UserEntity } from '../../domain/entities/user.entity';
import { Role } from '@/core/role/domain/entities/role.entity';
import { Company } from '@/core/company/domain/entities/company.entity';
import { Permission } from '@/core/permission/domain/entity/permission.entity';
import { UserPermissionEntity } from '@/core/user-permission/domain/entities/user-permission.entity';

// UserRules valida role/company só com @IsNotEmpty() (não @IsInstance()), então
// aqui não precisa do truque de prototype do módulo de batch — objeto plano
// truthy já basta.
export const makeCompany = (overrides: Partial<Company> = {}): Company => {
  return { id: 'company-1', ...overrides } as unknown as Company;
};

export const makeRole = (overrides: Partial<Role> = {}): Role => {
  return { id: 'role-1', name: 'Funcionário', ...overrides } as unknown as Role;
};

export const makePermission = (overrides: Partial<Permission> = {}): Permission => {
  return {
    id: 'permission-1',
    action: 'reader',
    subject: 'sale',
    description: 'Visualizar vendas',
    ...overrides,
  } as unknown as Permission;
};

export const makeUserPermission = (
  overrides: Partial<{ id: string; permission: Permission }> = {},
): UserPermissionEntity => {
  return {
    id: overrides.id ?? 'user-permission-1',
    user: undefined,
    permission: overrides.permission ?? makePermission(),
  } as unknown as UserPermissionEntity;
};

// A entidade retornada pelos mocks de repositório precisa estar realmente
// ligada a UserEntity.prototype: os usecases chamam métodos reais da entidade
// (update, updatePassword, inativateUser, verifyEmail) que só existem lá —
// um objeto puramente "as unknown as UserEntity" sem o prototype certo faria
// esses métodos virar `undefined is not a function`. Como são propriedades
// próprias, a leitura não passa pelos getters/validate() (que só roda no
// construtor real), então não precisa satisfazer o UserValidator.
export const makeUser = (overrides: Record<string, unknown> = {}): UserEntity => {
  const user = {
    id: 'user-1',
    username: 'joana',
    name: 'Joana Silva',
    email: 'joana@example.com',
    password: 'hashed-password',
    active: true,
    emailVerified: true,
    emailVerifiedAt: new Date() as Date | null,
    passwordResetCode: null as string | null,
    expiredAtCode: null as Date | null,
    role: makeRole(),
    company: makeCompany(),
    createdBy: 'user-0',
    updatedBy: 'user-0',
    deletedBy: null,
    userPermissions: [] as UserPermissionEntity[],
    auditable: { createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    update(props: { username: string; name: string; email: string; role: Role; updatedBy: string }) {
      this.username = props.username;
      this.name = props.name;
      this.email = props.email;
      this.role = props.role;
      this.updatedBy = props.updatedBy;
    },
    updatePassword(props: { password: string; updatedBy?: string }) {
      this.password = props.password;
      if (props.updatedBy) this.updatedBy = props.updatedBy;
    },
    inativateUser() {
      this.active = false;
    },
    verifyEmail() {
      this.emailVerified = true;
      this.emailVerifiedAt = new Date();
    },
    updateResetPasswordCode(code?: string) {
      this.passwordResetCode = code ?? null;
      this.expiredAtCode = code ? new Date(Date.now() + 3600_000) : null;
    },
    ...overrides,
  };
  Object.setPrototypeOf(user, UserEntity.prototype);
  return user as unknown as UserEntity;
};

export const makeLoggedUser = (
  overrides: Partial<{ id: string; company: Company }> = {},
): UserEntity => {
  return {
    id: overrides.id ?? 'admin-1',
    company: overrides.company ?? makeCompany(),
  } as unknown as UserEntity;
};
