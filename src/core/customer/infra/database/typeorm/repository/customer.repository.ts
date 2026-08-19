import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsRelations, Repository } from 'typeorm';
import { CustomerRepository } from '@/core/customer/domain/repositories/customer.repository';
import { Customer } from '@/core/customer/domain/entities/customer.entity';
import { Pagination, PaginationInput } from '@/shared/domain/pagination/pagination';
import { CustomerSchema } from '../schema/customer.schema';
import { CustomerMapper } from './customer-mapper';

export class CustomerRepositoryImpl implements CustomerRepository {
  constructor(
    @InjectRepository(CustomerSchema)
    private readonly customerRepository: Repository<CustomerSchema>,
  ) {}

  async save(entity: Customer): Promise<Customer> {
    const schema = CustomerMapper.toSchema(entity);
    const saved = await this.customerRepository.save(schema);
    return CustomerMapper.toEntity(saved);
  }

  async update(entity: Customer): Promise<void> {
    const schema = CustomerMapper.toSchema(entity);
    await this.customerRepository.save(schema);
  }

  async findById(id: string): Promise<Customer | null> {
    const schema = await this.customerRepository.findOne({
      where: { id },
      relations: this.getRelations(),
    });
    return schema ? CustomerMapper.toEntity(schema) : null;
  }

  async findCustomerByIdAndCompanyId(
    customerId: string,
    companyId: string,
  ): Promise<Customer | null> {
    const schema = await this.customerRepository.findOne({
      where: { id: customerId, company: { id: companyId } },
      relations: this.getRelations(),
    });
    return schema ? CustomerMapper.toEntity(schema) : null;
  }

  async findCustomerByCpfAndCompanyId(
    cpf: string,
    companyId: string,
    excludeCustomerId?: string,
  ): Promise<Customer | null> {
    const query = this.customerRepository
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.address', 'address')
      .leftJoinAndSelect('address.city', 'city')
      .leftJoinAndSelect('city.state', 'state')
      .leftJoinAndSelect('customer.company', 'company')
      .where('customer.cpf = :cpf', { cpf })
      .andWhere('customer.company = :companyId', { companyId });

    if (excludeCustomerId) {
      query.andWhere('customer.id != :excludeCustomerId', { excludeCustomerId });
    }

    const schema = await query.getOne();

    return schema ? CustomerMapper.toEntity(schema) : null;
  }

  async findAllByCompanyId(
    companyId: string,
    search: string | undefined,
    pagination?: PaginationInput,
  ): Promise<Pagination<Customer>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 10;
    const direction = pagination?.direction ?? 'DESC';

    const query = this.customerRepository
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.address', 'address')
      .leftJoinAndSelect('address.city', 'city')
      .leftJoinAndSelect('city.state', 'state')
      .leftJoinAndSelect('customer.company', 'company')
      .where('customer.company = :companyId', { companyId });

    if (search) {
      query.andWhere(
        '(customer.name ILIKE :search OR customer.cpf ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [schemas, totalItems] = await query
      // Empate no createdAt deixa a ordem instável entre páginas no
      // Postgres — o id como critério de desempate garante ordem
      // determinística, sem duplicar/pular linhas ao paginar.
      .orderBy('customer.createdAt', direction)
      .addOrderBy('customer.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const items = schemas.map((schema) => CustomerMapper.toEntity(schema));

    return {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async delete(id: string): Promise<void> {
    await this.customerRepository.softDelete(id);
  }

  private getRelations(): FindOptionsRelations<CustomerSchema> {
    return {
      address: {
        city: {
          state: true,
        },
      },
      company: true,
    };
  }
}
