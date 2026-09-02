import { Inject } from '@nestjs/common';
import type { UserRepository } from '@/core/user/domain/repositories/user.repository';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { Transactional } from '@/shared/infra/database/typeorm/decorators/transactional.decorator';

type Input = {
  id: string;
};

type Output = void;

export class InactivateUserUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  @Transactional()
  async execute(input: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const user = await this.userRepository.findById(input.id);

    if (!user || user.company.id !== loggedUser?.company?.id) {
      throw new NotFoundError(`Usuário não encontrado`);
    }

    user.inativateUser();

    await this.userRepository.update(user);
  }
}
