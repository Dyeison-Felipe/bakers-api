import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject } from '@nestjs/common';
import { CategoryRepository } from '../../domain/repositories/category.repository';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { CategoryOutput } from '@/shared/application/output/category/category.output';
import { UserEntity } from '@/core/user/domain/entities/user.entity';
import { Category } from '../../domain/entities/category.entity';
import {
  Pagination,
  PaginationInput,
} from '@/shared/domain/pagination/pagination';

type Input = {
  pagination?: PaginationInput;
};

type Output = Pagination<CategoryOutput>;

export class FindAllCategoriesByCompanyUseCase
  implements UseCase<Input, Output>
{
  constructor(
    @Inject(PROVIDERS.CATEGORY_REPOSITORY)
    private readonly categoryRepository: CategoryRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  private loggedUser: UserEntity;

  async execute({ pagination }: Input): Promise<Output> {
    this.loggedUser = this.loggedUserService.getLoggedUser();

    const categories = await this.categoryRepository.findAllByCompanyId(
      this.loggedUser.company.id,
      pagination,
    );

    const items = this.mapToOutput(categories.items);

    return {
      items,
      meta: categories.meta,
    };
  }

  private mapToOutput(categories: Category[]): CategoryOutput[] {
    const map = new Map<string, CategoryOutput>();

    categories.forEach((category) => {
      map.set(category.id, {
        id: category.id,
        name: category.name,
        parentId: category.parent?.id ?? null,
        children: [],
      });
    });

    const roots: CategoryOutput[] = [];

    categories.forEach((category) => {
      const node = map.get(category.id)!;

      if (category.parent) {
        const parentNode = map.get(category.parent.id);
        if (parentNode) {
          parentNode.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  }
}