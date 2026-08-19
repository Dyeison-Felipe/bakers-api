import { BaseRepository } from '@/shared/domain/repository/base-repository';
import { Pagination, PaginationInput } from '@/shared/domain/pagination/pagination';
import { Customer } from '../entities/customer.entity';

export interface CustomerRepository extends BaseRepository<Customer> {
  update(entity: Customer): Promise<void>;
  findCustomerByIdAndCompanyId(
    customerId: string,
    companyId: string,
  ): Promise<Customer | null>;
  findCustomerByCpfAndCompanyId(
    cpf: string,
    companyId: string,
    excludeCustomerId?: string,
  ): Promise<Customer | null>;
  findAllByCompanyId(
    companyId: string,
    search: string | undefined,
    pagination?: PaginationInput,
  ): Promise<Pagination<Customer>>;
}
