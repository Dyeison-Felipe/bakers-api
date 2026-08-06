import { Company } from '@/core/company/domain/entities/company.entity';
import { CompanySchema } from '../schema/company.schema';
import { AddressRepositoryMapper } from '@/core/address/infra/database/typeorm/repository/mapper/address-repository.mapper';
import { Injectable } from '@nestjs/common';
import { PlanMapper } from '@/core/plan/infra/database/typeorm/repositories/mapper/plan-mapper';

@Injectable()
export class CompanyRepositoryMapper {
  static toEntity(schema: CompanySchema): Company {
    const entity = new Company({
      id: schema.id,
      fantasyName: schema.fantasyName,
      socialReazon: schema.socialReazon,
      cnpj: schema.cnpj,
      phoneNumber: schema.phoneNumber,
      active: schema.active,
      email: schema.email,
      stateRegistration: schema.stateRegistration,
      address: schema.address
        ? AddressRepositoryMapper.toEntity(schema.address)
        : null,
      plan: schema.plan ? PlanMapper.toEntity(schema.plan) : null,
      auditable: {
        createdAt: schema.createdAt,
        updatedAt: schema.updatedAt,
        deletedAt: schema.deletedAt,
      },
      createdBy: schema.createdBy,
      updatedBy: schema.updatedBy,
      deletedBy: schema.deletedBy,
    });

    return entity;
  }

  static toSchema(entity: Company): CompanySchema {
    const schema = CompanySchema.with({
      id: entity.id,
      fantasyName: entity.fantasyName,
      socialReazon: entity.socialReazon,
      cnpj: entity.cnpj,
      phoneNumber: entity.phoneNumber,
      active: entity.active,
      email: entity.email,
      stateRegistration: entity.stateRegistration,
      createdAt: entity.auditable?.createdAt,
      updatedAt: entity.auditable?.updatedAt,
      deletedAt: entity.auditable?.deletedAt,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
      deletedBy: entity.deletedBy,
      address: entity.address
        ? AddressRepositoryMapper.toSchema(entity.address)
        : undefined,
      plan: entity.plan ? PlanMapper.toSchema(entity.plan) : undefined,
    });

    return schema;
  }

  static toReference(id: string): CompanySchema {
    return { id } as CompanySchema;
  }
}
