import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject } from '@nestjs/common';
import { UserRepository } from '../../domain/repositories/user.repository';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { FindAllUsersOutput } from '@/shared/application/output/users/find-all-users.output';
import { UserEntity } from '../../domain/entities/user.entity';
import {
  Pagination,
  PaginationInput,
} from '@/shared/domain/pagination/pagination';

type Input = {
  pagination?: PaginationInput;
};

type Output = Pagination<FindAllUsersOutput>;

export class FindAllUsersUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute({ pagination }: Input): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const users = await this.userRepository.findAllByCompany(
      loggedUser.company.id,
      pagination,
    );

    return {
      items: users.items.map(this.mapToOutput),
      meta: users.meta,
    };
  }

  private mapToOutput(user: UserEntity): FindAllUsersOutput {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      active: user.active,
      role: { id: user.role.id, name: user.role.name },
    };
  }
}
