import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { CompanySubscriptionRepository } from '@/core/subscription/domain/repositories/company-subscription.repository';
import { CompanySubscription } from '@/core/subscription/domain/entities/company-subscription.entity';
import { CompanySubscriptionSchema } from '../schema/company-subscription.schema';
import { CompanySubscriptionMapper } from './mapper/company-subscription.mapper';

export class CompanySubscriptionRepositoryImpl
  implements CompanySubscriptionRepository
{
  constructor(
    @InjectRepository(CompanySubscriptionSchema)
    private readonly repository: Repository<CompanySubscriptionSchema>,
  ) {}

  private getRelations() {
    return {
      company: { address: { city: { state: true } }, plan: true },
      plan: true,
    };
  }

  async save(entity: CompanySubscription): Promise<CompanySubscription> {
    const schema = CompanySubscriptionMapper.toSchema(entity);
    const saved = await this.repository.save(schema);
    return CompanySubscriptionMapper.toEntity(saved);
  }

  async findById(id: string): Promise<CompanySubscription | null> {
    const schema = await this.repository.findOne({
      where: { id },
      relations: this.getRelations(),
    });
    if (!schema) return null;
    return CompanySubscriptionMapper.toEntity(schema);
  }

  async update(entity: CompanySubscription): Promise<CompanySubscription> {
    const schema = CompanySubscriptionMapper.toSchema(entity);
    const saved = await this.repository.save(schema);
    return CompanySubscriptionMapper.toEntity(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async findByMercadoPagoSubscriptionId(
    mercadoPagoSubscriptionId: string,
  ): Promise<CompanySubscription | null> {
    const schema = await this.repository.findOne({
      where: { mercadoPagoSubscriptionId },
      relations: this.getRelations(),
    });
    if (!schema) return null;
    return CompanySubscriptionMapper.toEntity(schema);
  }

  async findActiveByCompanyId(
    companyId: string,
  ): Promise<CompanySubscription | null> {
    const schema = await this.repository.findOne({
      where: { company: { id: companyId }, status: 'active' },
      relations: this.getRelations(),
    });
    if (!schema) return null;
    return CompanySubscriptionMapper.toEntity(schema);
  }

  async findAllPendingOlderThan(date: Date): Promise<CompanySubscription[]> {
    const schemas = await this.repository.find({
      where: { status: 'pending', createdAt: LessThan(date) },
      relations: this.getRelations(),
    });
    return schemas.map((schema) => CompanySubscriptionMapper.toEntity(schema));
  }
}
