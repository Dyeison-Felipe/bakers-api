import { CategoryOutput } from '@/shared/application/output/category/category.output';

export class FindAllCategoryPresenter {
  readonly id: string;
  readonly name: string;
  readonly parentId: string | null;
  readonly children: FindAllCategoryPresenter[];

  constructor(output: CategoryOutput) {
    this.id = output.id;
    this.name = output.name;
    this.parentId = output.parentId;
    this.children = output.children.map(
      (child) => new FindAllCategoryPresenter(child),
    );
  }
}