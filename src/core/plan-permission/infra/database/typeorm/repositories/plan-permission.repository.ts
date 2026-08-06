import { PlanPermissionRepository } from '@/core/plan-permission/domain/repositories/plan-permission.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { PlanPermissionSchema } from '../schema/plan-permission.schema';
import { Repository } from 'typeorm';
import { PlanPermission } from '@/core/plan-permission/domain/entity/plan-permission.entity';
import { PlanPermissionMapper } from './plan-permission.mapper';

export class PlanPermissionRepositoryImpl implements PlanPermissionRepository {
  constructor(
    @InjectRepository(PlanPermissionSchema)
    private readonly planPermissionRepository: Repository<PlanPermissionSchema>,
  ) {}

  async findAllPlansAndPermissions(): Promise<PlanPermission[]> {
    const plansPermissions = await this.planPermissionRepository.find({
      where: { plan: { active: true } },
      relations: ['plan', 'permission']
    });

    const entities = plansPermissions.map((planPermission) => PlanPermissionMapper.toEntity(planPermission));

    return entities
  }

  async saveMany(entities: PlanPermission[]): Promise<PlanPermission[]> {
    const schemas = entities.map((entity) =>
      PlanPermissionMapper.toSchema(entity),
    );

    const save = await this.planPermissionRepository.save(schemas);

    return save.map((planPermissionSchema) =>
      PlanPermissionMapper.toEntity(planPermissionSchema),
    );
  }

  async save(entity: PlanPermission): Promise<PlanPermission> {
    const schema = PlanPermissionMapper.toSchema(entity);

    const savePlanPermission = await this.planPermissionRepository.save(schema);

    return PlanPermissionMapper.toEntity(savePlanPermission);
  }

  async findById(id: string): Promise<PlanPermission | null> {
    const planPermissionSchema = await this.planPermissionRepository.findOne({
      where: { id },
    });

    if (!planPermissionSchema) return null;

    const planPermissionEntity =
      PlanPermissionMapper.toEntity(planPermissionSchema);

    return planPermissionEntity;
  }

  async update(entity: PlanPermission): Promise<PlanPermission> {
    const schema = PlanPermissionMapper.toSchema(entity);

    const savePlanPermission = await this.planPermissionRepository.save(schema);

    return PlanPermissionMapper.toEntity(savePlanPermission);
  }

  async delete(id: string): Promise<void> {
    await this.planPermissionRepository.softDelete(id);
  }

  async deleteAllByPlanId(planId: string): Promise<void> {
    await this.planPermissionRepository.softDelete({
      plan: { id: planId },
    });
  }
}
