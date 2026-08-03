import { PROVIDERS } from '@/shared/application/constants/providers';
import { UseCase } from '@/shared/application/usecase/usecase';
import { Inject } from '@nestjs/common';
import { CategoryRepository } from '../../domain/repositories/category.repository';
import { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';
import { UserEntity } from '@/core/user/domain/entities/user.entity';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { ConflictError } from '@/shared/application/errors/conflict-error';
import { ProductQueryRepository } from '@/core/product/application/queries/product.query';

type Input = {
  id: string;
};

type Output = void;

export class DeleteCategoryByCompanyUseCase implements UseCase<Input, Output> {
  constructor(
    @Inject(PROVIDERS.CATEGORY_REPOSITORY)
    private readonly categoryRepository: CategoryRepository,
    @Inject(PROVIDERS.PRODUCT_QUERY_REPOSITORY)
    private readonly productQueryRepository: ProductQueryRepository,
    @Inject(PROVIDERS.LOGGED_USER_SERVICE)
    private readonly loggedUserService: LoggedUserService,
  ) {}

  private loggedUser: UserEntity;

  async execute({ id }: Input): Promise<Output> {
    this.loggedUser = this.loggedUserService.getLoggedUser();
    const companyId = this.loggedUser.company.id;

    const category = await this.categoryRepository.findCategoryByIdAndCompanyId(
      id,
      companyId,
    );

    if (!category) {
      throw new NotFoundError(`Categoria não encontrada`);
    }

    const children = await this.categoryRepository.findChildrenByParentId(
      id,
      companyId,
    );

    const categoryIds = [category.id, ...children.map((child) => child.id)];

    const categoryIdsWithProducts =
      await this.productQueryRepository.findCategoryIdsWithLinkedProducts(
        categoryIds,
        companyId,
      );

    if (categoryIdsWithProducts.length > 0) {
      if (categoryIdsWithProducts.includes(category.id)) {
        throw new ConflictError(
          'Não é possível excluir: há produtos vinculados a esta categoria.',
        );
      }

      const affectedChildrenNames = children
        .filter((child) => categoryIdsWithProducts.includes(child.id))
        .map((child) => child.name);

      throw new ConflictError(
        `Não é possível excluir: as seguintes subcategorias possuem produtos vinculados: ${affectedChildrenNames.join(', ')}.`,
      );
    }

    await this.categoryRepository.deleteMany(categoryIds);
  }
}