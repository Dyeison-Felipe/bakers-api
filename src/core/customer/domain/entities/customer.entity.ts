import { Company } from '@/core/company/domain/entities/company.entity';
import { Address } from '@/core/address/domain/entities/address.entity';
import { EntityValidationError } from '@/shared/application/errors/validation-error';
import { Data } from '@/shared/domain/decorators/data.decorator';
import { BaseEntity } from '@/shared/domain/entity/base-entity';
import { CustomerValidatorFactory } from '../validator/customer-validator';

export type CustomerProps = {
  name: string;
  cpf: string;
  phoneNumber: string;
  email: string;
  address: Address;
  company?: Company | null;
  active: boolean;
  createdBy: string;
  updatedBy: string;
  deletedBy?: string | null;
};

type CreateCustomerProps = {
  name: string;
  cpf: string;
  phoneNumber: string;
  email: string;
  address: Address;
  company: Company;
  createdBy: string;
  updatedBy: string;
};

type UpdateCustomerProps = {
  name: string;
  cpf: string;
  phoneNumber: string;
  email: string;
  updatedBy: string;
};

export interface Customer extends CustomerProps {}

@Data()
export class Customer extends BaseEntity<CustomerProps> {
  static create(props: CreateCustomerProps): Customer {
    return new Customer({
      id: crypto.randomUUID(),
      name: props.name,
      cpf: props.cpf,
      phoneNumber: props.phoneNumber,
      email: props.email,
      address: props.address,
      company: props.company,
      active: true,
      createdBy: props.createdBy,
      updatedBy: props.createdBy,
      deletedBy: null,
    });
  }

  update(props: UpdateCustomerProps): void {
    this.name = props.name;
    this.cpf = props.cpf;
    this.phoneNumber = props.phoneNumber;
    this.email = props.email;
    this.updatedBy = props.updatedBy;
    this.updateTimestamp();
  }

  inactivate(updatedBy: string): void {
    this.active = false;
    this.updatedBy = updatedBy;
    this.updateTimestamp();
  }

  protected validate(): void {
    const validator = CustomerValidatorFactory.create();
    const isValid = validator.validate(this.props);
    if (!isValid) {
      throw new EntityValidationError(validator.errors);
    }
  }
}
