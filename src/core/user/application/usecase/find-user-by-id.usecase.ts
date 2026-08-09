import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject } from '@nestjs/common';
import { UserRepository } from '../../domain/repositories/user.repository';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { UserDetailOutput } from '@/shared/application/output/users/user-detail.output';

type Input = {
  id: string;
};

type Output = UserDetailOutput;

export class FindUserByIdUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute({ id }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const user = await this.userRepository.findByIdWithPermissions(id);

    if (!user || user.company.id !== loggedUser.company.id) {
      throw new NotFoundError(`Usuário não encontrado`);
    }

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      active: user.active,
      role: { id: user.role.id, name: user.role.name },
      permissions: (user.userPermissions ?? []).map((up) => ({
        id: up.permission.id,
        action: up.permission.action,
        subject: up.permission.subject,
        description: up.permission.description,
      })),
    };
  }
}
