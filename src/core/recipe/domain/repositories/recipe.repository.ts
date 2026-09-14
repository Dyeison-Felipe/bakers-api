import { BaseRepository } from '@/shared/domain/repository/base-repository';
import { Pagination, PaginationInput } from '@/shared/domain/pagination/pagination';
import { Recipe } from '../entities/recipe.entity';

export interface RecipeRepository extends BaseRepository<Recipe> {
  findById(id: string): Promise<Recipe | null>;
  findByIdAndCompanyId(id: string, companyId: string): Promise<Recipe | null>;
  findAllByCompanyId(companyId: string): Promise<Recipe[]>;
  findAllByIdsAndCompanyId(ids: string[], companyId: string): Promise<Recipe[]>;
  findAllByCompanyIdPaginated(
    companyId: string,
    pagination?: PaginationInput,
    name?: string,
  ): Promise<Pagination<Recipe>>;
}
