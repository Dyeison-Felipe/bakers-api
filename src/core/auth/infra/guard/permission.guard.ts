import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Inject,
  Injectable,
  Scope,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { AuthConstants } from '@/shared/application/constants/auth-constants';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { JwtService } from '@/shared/application/jwt/jwt.service';
import { UserRepository } from '@/core/user/domain/repositories/user.repository';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { UnauthorizedError } from '@/shared/application/errors/unauthorized-error';
import { ForbiddenError } from '@/shared/application/errors/forbidden-error';
import { PlanExpiredError } from '@/shared/application/errors/plan-expired-error';
import { SessionInvalidatedError } from '@/shared/application/errors/session-invalidated-error';
import { CaslAbilityService } from '../service/casl-ability.service';
import {
  ALLOW_SUPER_ADMIN_KEY,
  IS_PUBLIC_KEY,
  PERMISSIONS_KEY,
  SUPER_ADMIN_ONLY_KEY,
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
    const token = request.cookies?.[AuthConstants.tokenName];

    if (!token) throw new UnauthorizedError();

    try {
      const payload = await this.jwtService.verifyJwt(token);

      if (!payload) throw new UnauthorizedError();

      // 3. Busca usuário com permissions
      const user = await this.userRepository.findByIdWithPermissions(
        payload.sub,
      );

     

      if (!user || !user.active || user.expiredAtCode)
        throw new UnauthorizedError();

      // Sessão única por conta: se esse token não é mais a sessão ativa do
      // usuário (um login em outro navegador a substituiu), derruba aqui —
      // cobre o caso do WS de invalidação não ter alcançado esse navegador.
      if (user.activeSessionId && user.activeSessionId !== payload.sessionId) {
        throw new SessionInvalidatedError();
      }

      request.user = user;
      this.loggedUserService.setLoggedUser(user);

      // 3.5. Recursos de plataforma (ex: gestão de planos, empresas) — restritos
      // à role Super Admin, independente de qualquer permissão/plano de empresa.
      const requiresSuperAdmin = this.reflector.getAllAndOverride<boolean>(
        SUPER_ADMIN_ONLY_KEY,
        [context.getHandler(), context.getClass()],
      );

      const allowsSuperAdmin = this.reflector.getAllAndOverride<boolean>(
        ALLOW_SUPER_ADMIN_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (user.role.name === 'Super Admin') {
        // Super Admin só acessa rotas de plataforma (@SuperAdminOnly()) ou
        // marcadas como compartilhadas (@AllowSuperAdmin()) — não tem mais
        // bypass total do sistema operacional das empresas.
        if (requiresSuperAdmin || allowsSuperAdmin) return true;
        throw new ForbiddenError(
          'Este recurso não está disponível para o Super Admin',
        );
      }

      if (requiresSuperAdmin) {
        throw new ForbiddenError(
          'Apenas o Super Admin pode acessar esse recurso',
        );
      }

      // 3.6. Bloqueia empresas com o plano vencido (ou já desativadas pelo job
      // de expiração) — cobre tanto a checagem "em tempo real" (a data já
      // passou mas o cron diário ainda não rodou) quanto o estado já persistido.
      if (
        !user.company.active ||
        user.company.planExpiresAt.getTime() < Date.now()
      ) {
        throw new PlanExpiredError();
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

      if (!allInPlan) {
        throw new ForbiddenError(
          'Esta ação não está disponível no plano contratado pela empresa',
        );
      }

      //6. Verifica role admin da empresa (diferente de Super Admin)
      if (user.role.name === 'Admin') return true;

      // 7. Usuário comum → verifica permissões individuais com CASL
      const ability = this.caslAbilityService.createForUser(user);

      const hasPermission = policies.every(({ action, resource }) =>
        ability.can(action, resource),
      );

      if (!hasPermission) {
        throw new ForbiddenError(
          'Você não tem permissão para executar esta ação',
        );
      }

      return true;
    } catch (error) {
      // UnauthorizedError/ForbiddenError/PlanExpiredError (e qualquer outro
      // HttpException lançado de propósito) devem propagar com seu próprio
      // status/corpo — só falhas inesperadas viram um 401 genérico aqui.
      if (error instanceof HttpException) {
        throw error;
      }
      throw new UnauthorizedError(`Not authorized: ${error}`);
    }
  }
}
