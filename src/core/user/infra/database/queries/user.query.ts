import { Repository } from 'typeorm';
import { UserSchema } from '../typeorm/schema/user.schema';
import { InjectRepository } from '@nestjs/typeorm';
import {
  UserByLogin,
  UserGuard,
  UserQuery,
} from '@/core/user/application/queries/user.query';

export class UserQueryImpl implements UserQuery {
  constructor(
    @InjectRepository(UserSchema)
    private readonly userRepository: Repository<UserSchema>,
  ) {}

  async findUserGuardBySub(sub: string, email?: string ): Promise<UserGuard | null> {
    const result = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.role', 'role')
      .leftJoin('user.company', 'company')
      .leftJoin('company.plan', 'plan')
      .leftJoin('plan.planPermission', 'planPermission') // nome correto da propriedade
      .leftJoin('planPermission.permission', 'planPerm') // alias diferente
      .leftJoin('user.userPermissions', 'userPermissions')
      .leftJoin('userPermissions.permission', 'userPerm')
      .select([
        'user.id',
        'user.email',
        'user.username',
        'user.active',
        'role.name',
        'company.id',
        'company.cnpj',
        'company.stateRegistration',
        'company.fantasyName',
        'company.socialReazon',
        'company.active',
        'company.planExpiresAt',
        'plan.id',
        'plan.name',
        'plan.price',
        'plan.duration',
        'planPermission.id',
        'planPerm.id',
        'planPerm.action',
        'planPerm.subject',
        'planPerm.description',
        'userPermissions.id',
        'userPerm.id',
        'userPerm.action',
        'userPerm.subject',
        'userPerm.description',
      ])
      .where('user.id = :sub', { sub })
      .orWhere('user.email = :email', { email })
      .getOne();

    if (!result) return null;

    const user: UserGuard = {
      id: result.id,
      username: result.username,
      email: result.email,
      active: result.active,
      role: result.role.name,
      company: {
        id: result.company.id,
        cnpj: result.company.cnpj,
        stateRegistration: result.company.stateRegistration,
        fantasyName: result.company.fantasyName,
        socialReazon: result.company.socialReazon,
        active: result.company.active,
        planExpiresAt: result.company.planExpiresAt,
        plan: {
          id: result.company.plan.id,
          name: result.company.plan.name,
          price: result.company.plan.price,
          duration: result.company.plan.duration,
          permissions:
            result.company.plan.planPermission?.map((pp) => ({
              id: pp.permission.id,
              action: pp.permission.action,
              subject: pp.permission.subject,
              description: pp.permission.description,
            })) ?? [],
        },
      },
      permissions:
        result.userPermissions?.map((up) => ({
          id: up.permission.id,
          action: up.permission.action,
          subject: up.permission.subject,
          description: up.permission.description,
        })) ?? [],
    };

    return user;
  }

  async findUserByEmail(email: string): Promise<UserByLogin | null> {
    const queryBuilder = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.role', 'role')
      .leftJoin('user.userPermissions', 'userPermissions')
      .leftJoin('userPermissions.permission', 'permission')
      .leftJoin('user.company', 'company')
      .leftJoin('company.plan', 'plan')
      .leftJoin('plan.planPermission', 'planPermission')
      .leftJoin('planPermission.permission', 'planPerm')
      .select([
        'user.id',
        'user.email',
        'user.password',
        'user.username',
        'user.active',
        'user.emailVerified',
        'user.activeSessionId',
        'role.name',
        'company.id',
        'company.fantasyName',
        'company.socialReazon',
        'company.cnpj',
        'company.stateRegistration',
        'company.active',
        'company.planExpiresAt',
        'userPermissions.id',
        'permission.id',
        'permission.action',
        'permission.subject',
        'plan.id',
        'plan.name',
        'plan.price',
        'plan.duration',
        'planPermission.id',
        'planPerm.id',
        'planPerm.action',
        'planPerm.subject',
        'planPerm.description',
      ])
      .where('user.email = :email', { email })
      .getOne();

    if (!queryBuilder) return null;

    const user: UserByLogin = {
      id: queryBuilder.id,
      username: queryBuilder.username,
      email: queryBuilder.email,
      password: queryBuilder.password,
      active: queryBuilder.active,
      emailVerified: queryBuilder.emailVerified,
      activeSessionId: queryBuilder.activeSessionId ?? null,
      role: queryBuilder.role.name,
      company: {
        id: queryBuilder.company.id,
        cnpj: queryBuilder.company.cnpj,
        stateRegistration: queryBuilder.company.stateRegistration,
        socialReazon: queryBuilder.company.socialReazon,
        fantasyName: queryBuilder.company.fantasyName,
        active: queryBuilder.company.active,
        planExpiresAt: queryBuilder.company.planExpiresAt,
        plan: queryBuilder.company.plan
          ? {
              id: queryBuilder.company.plan.id,
              name: queryBuilder.company.plan.name,
              price: queryBuilder.company.plan.price,
              duration: queryBuilder.company.plan.duration,
              permissions:
                queryBuilder.company.plan.planPermission?.map((pp) => ({
                  id: pp.permission.id,
                  action: pp.permission.action,
                  subject: pp.permission.subject,
                  description: pp.permission.description,
                })) ?? [],
            }
          : undefined,
      },
      permissions:
        queryBuilder.userPermissions?.map((up) => ({
          id: up.permission.id,
          action: up.permission.action,
          subject: up.permission.subject,
          description: up.permission.description,
        })) ?? [],
    };

    return user;
  }
}
