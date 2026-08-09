import { CompanyRepository } from '@/core/company/domain/repositories/company.repository';
import { PROVIDERS } from '@/shared/application/constants/providers';
import { InjectRepository } from '@nestjs/typeorm';
import { CompanySchema } from '../schema/company.schema';
import { Repository } from 'typeorm';
import { Company } from '@/core/company/domain/entities/company.entity';
import { CompanyRepositoryMapper } from './company-repository.mapper';

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
}
