import { CompanySchema } from '@/core/company/infra/database/typeorm/schema/company.schema';
import { RoleSchema } from '@/core/role/infra/database/typeorm/schema/role.schema';
import { UserPermissionSchema } from '@/core/user-permission/infra/database/typeorm/schema/user-permission.schema';
import { BaseSchema } from '@/shared/infra/database/typeorm/schema/baseSchema/baseSchema';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('user')
export class UserSchema extends BaseSchema {
  @Column()
  username: string;

  @Column()
  name: string;

  @Column()
  password: string;

  @Column()
  email: string;

  @Column()
  active: boolean;

  @Column({ name: 'email_verified' })
  emailVerified: boolean;

  @Column({ name: 'email_verified_at', type: 'timestamp', nullable: true })
  emailVerifiedAt: Date | null;

  @Column({
    name: 'password_reset_code',
    type: 'varchar',
    nullable: true,
    length: 6,
  })
  passwordResetCode?: string | null;

  @Column({ name: 'expired_at_code', type: 'timestamp', nullable: true })
  expiredAtCode?: Date | null;

  @Column({ name: 'active_session_id', type: 'uuid', nullable: true })
  activeSessionId?: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: false, })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: false, })
  updatedBy: string;

  @Column({
    name: 'deleted_by',
    type: 'uuid',
    nullable: true,
  })
  deletedBy: string | null;

  @JoinColumn({
    name: 'role',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_user_role',
  })
  @ManyToOne(() => RoleSchema, (role) => role.user)
  role: RoleSchema;

  @JoinColumn({
    name: 'company',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_user_company',
  })
  @ManyToOne(() => CompanySchema, (company) => company.user)
  company: CompanySchema;

  @OneToMany(() => UserPermissionSchema, (up) => up.user)
  userPermissions?: UserPermissionSchema[];
}
