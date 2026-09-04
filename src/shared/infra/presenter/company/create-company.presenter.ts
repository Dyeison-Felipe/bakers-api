import { ApiProperty } from '@nestjs/swagger';
import { PlanPresenter } from '../plan/plan.presenter';
import { AddressPresenter } from '../address/address.preseter';

export class CreateCompanyPresenter {
  @ApiProperty({ description: 'Id de identidicação da empresa', type: String })
  readonly id: string;

  @ApiProperty({ description: 'Nome fantasia da empresa', type: String })
  readonly fantasyName: string;

  @ApiProperty({ description: 'Razão social da empresa', type: String })
  readonly socialReazon: string;

  @ApiProperty({ description: 'Cnpj social da empresa', type: String })
  readonly cnpj: string;

  @ApiProperty({ description: 'E-mail da empresa', type: String })
  readonly email: string;

  @ApiProperty({ description: 'Número do telefone da empresa', type: String })
  readonly phoneNumber: string;

  @ApiProperty({ description: 'Imagem da logo da empresa', type: String })
  readonly stateRegistration: string;

  @ApiProperty({ description: 'Status da empresa', type: String })
  readonly active: boolean;

  @ApiProperty({ description: 'Data de início da vigência do plano' })
  readonly planStartedAt: Date;

  @ApiProperty({ description: 'Data de expiração do plano' })
  readonly planExpiresAt: Date;

  @ApiProperty({ description: 'Enderço da empresa', type: AddressPresenter })
  address: AddressPresenter;

  @ApiProperty({ description: 'Plano da empresa', type: PlanPresenter })
  plan: PlanPresenter;

  constructor(props: CreateCompanyPresenter) {
    this.id = props.id;
    this.active = props.active;
    this.email = props.email;
    this.fantasyName = props.fantasyName;
    this.socialReazon = props.socialReazon;
    this.cnpj = props.cnpj;
    this.stateRegistration = props.stateRegistration;
    this.phoneNumber = props.phoneNumber;
    this.address = props.address;
    this.plan = props.plan;
    this.planStartedAt = props.planStartedAt;
    this.planExpiresAt = props.planExpiresAt;
  }
}
