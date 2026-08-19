import { Injectable } from '@nestjs/common';
import { Customer } from '@/core/customer/domain/entities/customer.entity';
import { AddressRepositoryMapper } from '@/core/address/infra/database/typeorm/repository/mapper/address-repository.mapper';
import { CompanyRepositoryMapper } from '@/core/company/infra/database/typeorm/repository/company-repository.mapper';
import { CustomerSchema } from '../schema/customer.schema';

@Injectable()
export class CustomerMapper {
  static toEntity(schema: CustomerSchema): Customer {
    return new Customer({
      id: schema.id,
      name: schema.name,
      cpf: schema.cpf,
      phoneNumber: schema.phoneNumber,
      email: schema.email,
      active: schema.active,
      address: AddressRepositoryMapper.toEntity(schema.address),
      company: schema.company
        ? CompanyRepositoryMapper.toEntity(schema.company)
        : null,
      auditable: {
        createdAt: schema.createdAt,
        updatedAt: schema.updatedAt,
        deletedAt: schema.deletedAt,
      },
      createdBy: schema.createdBy,
      updatedBy: schema.updatedBy,
      deletedBy: schema.deletedBy,
    });
  }

  static toSchema(entity: Customer): CustomerSchema {
    return CustomerSchema.with({
      id: entity.id,
      name: entity.name,
      cpf: entity.cpf,
      phoneNumber: entity.phoneNumber,
      email: entity.email,
      active: entity.active,
      address: AddressRepositoryMapper.toSchema(entity.address),
      company: entity.company
        ? CompanyRepositoryMapper.toSchema(entity.company)
        : undefined,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
      deletedBy: entity.deletedBy,
      createdAt: entity.auditable?.createdAt,
      updatedAt: entity.auditable?.updatedAt,
      deletedAt: entity.auditable?.deletedAt,
    });
  }
}
