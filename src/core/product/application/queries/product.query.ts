export type CategoryIdsWithLinkedProducts = string[];

export interface ProductQueryRepository {
  findCategoryIdsWithLinkedProducts(
    categoryIds: string[],
    companyId: string,
  ): Promise<CategoryIdsWithLinkedProducts>;
}