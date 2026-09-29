import { UserQuery } from '@/core/user/application/queries/user.query';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { SessionOutput } from '@/shared/application/output/auth/login.output';
import { UnauthorizedError } from '@/shared/application/errors/unauthorized-error';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject } from '@nestjs/common';
import { toSessionOutput } from '../helpers/session-output.helper';

type Input = void;

type Output = SessionOutput;

// Recarrega os dados da sessão atual (os mesmos do login, sem gerar token) —
// ex.: depois de a empresa assinar um plano, o plano e as permissões mudam e
// o front precisa deles sem pedir um novo login.
export class FindSessionUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.USER_QUERY)
    private readonly userQuery: UserQuery,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const user = await this.userQuery.findUserByEmail(loggedUser.email);

    if (!user) {
      throw new UnauthorizedError();
    }

    return toSessionOutput(user);
  }
}
