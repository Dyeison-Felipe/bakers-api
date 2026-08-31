import { BaseRepository } from "@/shared/domain/repository/base-repository";
import { Pagination, PaginationInput } from "@/shared/domain/pagination/pagination";
import { Company } from "../entities/company.entity";

export interface CompanyRepository extends BaseRepository<Company> {
  findByCnpj(cnpj: string): Promise<Company | null>
  findAllPaginated(
    pagination?: PaginationInput,
    search?: string,
  ): Promise<Pagination<Company>>
  findAllActiveWithExpiredPlan(): Promise<Company[]>
}