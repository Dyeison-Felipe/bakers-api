import { AddressOutput } from '../address/address.output';

export type CustomerOutput = {
  id: string;
  name: string;
  cpf: string;
  phoneNumber: string;
  email: string;
  active: boolean;
  address: AddressOutput;
};
