import { PlanRepository } from '@/core/plan/domain/repositories/plan.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { PlanSchema } from '../schema/plan.schema';
import { Repository } from 'typeorm';
import { Plan } from '@/core/plan/domain/entities/plan.entity';
import { PlanMapper } from './mapper/plan-mapper';

export class PlanRepositoryImpl implements PlanRepository {
  constructor(
    @InjectRepository(PlanSchema)
    private readonly planRepository: Repository<PlanSchema>,
  ) {}

  async findAll(): Promise<Plan[]> {
    const plans = await this.planRepository.find({
      relations: ['planPermission', 'planPermission.permission'],
    });

    return plans.map((plan) => PlanMapper.toEntity(plan));
  }

  async findByName(name: string): Promise<Plan | null> {
    const planShchema = await this.planRepository.findOne({
      where: { name },
    });

    if (!planShchema) return null;

    const planEntity = PlanMapper.toEntity(planShchema);

    return planEntity;
  }

  async save(entity: Plan): Promise<Plan> {
    const schema = PlanMapper.toSchema(entity);

    const savedPlan = await this.planRepository.save(schema);

    const planEntity = PlanMapper.toEntity(savedPlan);

    return planEntity;
  }

  async findById(id: string): Promise<Plan | null> {
    const planSchema = await this.planRepository.findOne({
      where: { id },
      relations: ['planPermission', 'planPermission.permission'],
    });

    if (!planSchema) return null;

    const planEntity = PlanMapper.toEntity(planSchema);

    return planEntity;
  }

  async update(entity: Plan): Promise<Plan> {
    const schema = PlanMapper.toSchema(entity);

    const savedPlan = await this.planRepository.save(schema);

    const planEntity = PlanMapper.toEntity(savedPlan);

    return planEntity;
  }

  async delete(id: string): Promise<void> {
    await this.planRepository.softDelete(id);
  }
}
