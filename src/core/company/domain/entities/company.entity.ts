import { Address } from '@/core/address/domain/entities/address.entity';
import { Data } from '@/shared/domain/decorators/data.decorator';
import { BaseEntity } from '@/shared/domain/entity/base-entity';
import { CompanyValidatorFactory } from '../validators/company-validator';
import { EntityValidationError } from '@/shared/application/errors/validation-error';
import { ID_USER_DEFAULT } from '@/shared/application/constants/id-user-default';
import { Plan } from '@/core/plan/domain/entities/plan.entity';

export type CompanyProps = {
  fantasyName: string;
  socialReazon: string;
  cnpj: string;
  email: string;
  phoneNumber: string;
  logotipo?: string;
  active: boolean;
  stateRegistration: string;
  address?: Address | null;
  plan?: Plan | null;
  createdBy: string;
  updatedBy: string;
  deletedBy?: string | null;
};

type CreateCompanyProps = {
  fantasyName: string;
  socialReazon: string;
  cnpj: string;
  email: string;
  phoneNumber: string;
  stateRegistration: string;
  address: Address;
  plan: Plan;
  createdBy: string;
  updatedBy: string;
};

type UpdateCompanyProps = {
  fantasyName: string;
  socialReazon: string;
  cnpj: string;
  email: string;
  plan: Plan;
  phoneNumber: string;
  stateRegistration: string;
  address?: Address;
  updatedBy: string;
};

export interface Company extends CompanyProps { }

@Data()
export class Company extends BaseEntity<CompanyProps> {
  static create(props: CreateCompanyProps): Company {
    return new Company({
      id: crypto.randomUUID(),
      fantasyName: props.fantasyName,
      socialReazon: props.socialReazon,
      cnpj: props.cnpj,
      email: props.email,
      active: true,
      phoneNumber: props.phoneNumber,
      stateRegistration: props.stateRegistration,
      address: props.address,
      plan: props.plan,
      createdBy: props.createdBy ?? ID_USER_DEFAULT,
      updatedBy: props.updatedBy ?? ID_USER_DEFAULT,
    });
  }

  update(props: UpdateCompanyProps): void {
    this.fantasyName = props.fantasyName;
    this.socialReazon = props.socialReazon;
    this.cnpj = props.cnpj;
    this.email = props.email;
    this.phoneNumber = props.phoneNumber;
    this.stateRegistration = props.stateRegistration;
    this.updatedBy = props.updatedBy;
    this.plan = props.plan;
    this.updateTimestamp();
  }

  protected validate(): void {
    const validator = CompanyValidatorFactory.create();

    const isValid = validator.validate(this.props);
    if (!isValid) {
      throw new EntityValidationError(validator.errors);
    }
  }
}
