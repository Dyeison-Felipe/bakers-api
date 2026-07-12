import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject } from '@nestjs/common';
import { CategoryRepository } from '../../domain/repositories/category.repository';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { UserEntity } from '@/core/user/domain/entities/user.entity';
import { NotFoundError } from '@/shared/application/errors/not-found-error';

type Input = {
  id: string;
};

type Output = void;

export class DeleteCategoryByCompanyUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.CATEGORY_REPOSITORY)
    private readonly categoryRepository: CategoryRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  private loggedUser: UserEntity;

  async execute({ id }: Input): Promise<Output> {
    this.loggedUser = this.loggedUserService.getLoggedUser();

    const category = await this.categoryRepository.findCategoryByIdAndCompanyId(
      id,
      this.loggedUser.company.id,
    );

    if (!category) {
      throw new NotFoundError(`Categoria não encontrada`);
    }

    await this.categoryRepository.delete(id);
  }
}
