import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Scope,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { JwtService } from '@/shared/application/jwt/jwt.service';
import { UserRepository } from '@/core/user/domain/repositories/user.repository';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { UnauthorizedError } from '@/shared/application/errors/unauthorized-error';
import { CaslAbilityService } from '../service/casl-ability.service';
import {
  IS_PUBLIC_KEY,
  PERMISSIONS_KEY,
} from '@/shared/infra/decorators/permission.decorator';
import { PermissionRef } from '../../domain/permissions-definition/permissions';

@Injectable({ scope: Scope.REQUEST })
export class PermissionGuard implements CanActivate {
  constructor(
    @Inject(PROVIDERS.JWT_SERVICE) private readonly jwtService: JwtService,
    @Inject(PROVIDERS.USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
    @Inject(PROVIDERS.CASL_ABILITY_SERVICE)
    private readonly caslAbilityService: CaslAbilityService,
    @Inject(Reflector)
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Rota pública, libera sem verificar nada
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    // 2. Valida o token
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = request.cookies?.developmentAuthToken;

    if (!token) throw new UnauthorizedError();

    try {
      const payload = await this.jwtService.verifyJwt(token);

      if (!payload) return false;

      // 3. Busca usuário com permissions
      const user = await this.userRepository.findByIdWithPermissions(
        payload.sub,
      );

      if (!user || !user.active || user.expiredAtCode)
        throw new UnauthorizedError();

      request.user = user;
      this.loggedUserService.setLoggedUser(user);

      if (user.role.name === 'Super Admin') {
        return true;
      }

      // 4. Verifica permissões com CASL
      const policies = this.reflector.getAllAndOverride<PermissionRef[]>(
        PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (!policies || policies.length === 0) return true;

      //5. Verifica se a permissão está inclusa no plano da empresa
      const planPermissions = user.company.plan?.permissions ?? [];

      const allInPlan = policies.every(({ action, resource }) =>
        planPermissions.some(
          (p) => p.action === action && p.subject === resource,
        ),
      );

      if(!allInPlan) throw new UnauthorizedError('Permissão não inclusa no plano');
      
      //6. Verifica role admin da empresa (diferente de Super Admin)
      if (user.role.name === 'Admin') return true;

      // 7. Usuário comum → verifica permissões individuais com CASL
      const ability = this.caslAbilityService.createForUser(user);

      return policies.every(({ action, resource }) =>
        ability.can(action, resource),
      );
    } catch (error) {
      throw new UnauthorizedError(`Not authorized: ${error}`);
    }
  }
}
