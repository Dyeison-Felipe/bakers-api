import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject } from '@nestjs/common';
import { RoleRepository } from '../../domain/repositories/role.repository';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { RoleOutput } from '@/shared/application/output/role/role.output';

type Input = void;

type Output = RoleOutput[];

export class FindAllRolesUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  async execute(): Promise<Output> {
    const loggedUser = this.loggedUserService.getLoggedUser();

    const roles = await this.roleRepository.findAllByCompany(
      loggedUser.company.id,
    );

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
    }));
  }
}
