import { ApiProperty } from '@nestjs/swagger';
import { AddressPresenter } from '../address/address.preseter';

export class CustomerPresenter {
  @ApiProperty({ description: 'Id do cliente' })
  readonly id: string;

  @ApiProperty({ description: 'Nome do cliente' })
  readonly name: string;

  @ApiProperty({ description: 'CPF do cliente' })
  readonly cpf: string;

  @ApiProperty({ description: 'Telefone do cliente' })
  readonly phoneNumber: string;

  @ApiProperty({ description: 'E-mail do cliente' })
  readonly email: string;

  @ApiProperty({ description: 'Status do cliente' })
  readonly active: boolean;

  @ApiProperty({ description: 'Endereço do cliente', type: AddressPresenter })
  readonly address: AddressPresenter;

  constructor(props: CustomerPresenter) {
    this.id = props.id;
    this.name = props.name;
    this.cpf = props.cpf;
    this.phoneNumber = props.phoneNumber;
    this.email = props.email;
    this.active = props.active;
    this.address = props.address;
  }
}
