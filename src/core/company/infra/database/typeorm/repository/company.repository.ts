import { CompanyRepository } from '@/core/company/domain/repositories/company.repository';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { InjectRepository } from '@nestjs/typeorm';
import { CompanySchema } from '../schema/company.schema';
import { LessThan, Repository } from 'typeorm';
import { Company } from '@/core/company/domain/entities/company.entity';
import { CompanyRepositoryMapper } from './company-repository.mapper';
import {
  Pagination,
  PaginationInput,
} from '@/shared/domain/pagination/pagination';

export class CompanyRepositoryImpl implements CompanyRepository {
  constructor(
    @InjectRepository(CompanySchema)
    private readonly companyRepository: Repository<CompanySchema>,
  ) {}

  async findByCnpj(cnpj: string): Promise<Company | null> {
    const schema = await this.companyRepository.findOne({
      where: {cnpj},
      relations: ['plan', 'address']
    })

    if(!schema) return null;

    const entity = CompanyRepositoryMapper.toEntity(schema);

    return entity;
  }

  async save(entity: Company): Promise<Company> {
    const schema = CompanyRepositoryMapper.toSchema(entity);

    const save = await this.companyRepository.save(schema);

    const companyEntity = CompanyRepositoryMapper.toEntity(save);

    return companyEntity;
  }

  async findById(id: string): Promise<Company | null> {
    const companySchema = await this.companyRepository.findOne({
      where: { id },
      relations: ['address', 'address.city', 'address.city.state', 'plan'],
    });

    if (!companySchema) return null;

    const companyEntity = CompanyRepositoryMapper.toEntity(companySchema);

    return companyEntity;
  }

  async update(entity: Company): Promise<Company> {
    const schema = CompanyRepositoryMapper.toSchema(entity);

    const save = await this.companyRepository.save(schema);

    const companyEntity = CompanyRepositoryMapper.toEntity(save);

    return companyEntity;
  }

  async delete(id: string): Promise<void> {
    await this.companyRepository.softDelete(id);
  }

  async findAllPaginated(
    pagination?: PaginationInput,
    search?: string,
  ): Promise<Pagination<Company>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const direction = pagination?.direction ?? 'DESC';

    const query = this.companyRepository
      .createQueryBuilder('company')
      .leftJoinAndSelect('company.plan', 'plan');

    if (search) {
      query.andWhere(
        '(company.fantasyName ILIKE :search OR company.cnpj ILIKE :search OR company.socialReazon ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    query
      .orderBy('company.createdAt', direction)
      .addOrderBy('company.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [companiesSchema, totalItems] = await query.getManyAndCount();

    const items = companiesSchema.map((schema) =>
      CompanyRepositoryMapper.toEntity(schema),
    );

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

  async findAllActiveWithExpiredPlan(): Promise<Company[]> {
    const companiesSchema = await this.companyRepository.find({
      where: { active: true, planExpiresAt: LessThan(new Date()) },
      relations: ['plan', 'address'],
    });

    return companiesSchema.map((schema) =>
      CompanyRepositoryMapper.toEntity(schema),
    );
  }
}
