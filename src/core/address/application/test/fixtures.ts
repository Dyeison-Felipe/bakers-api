import { StateEntity } from '@/core/state/domain/entities/state.entity';
import { CityEntity } from '@/core/city/domain/entities/city.entity';
import { Address } from '../../domain/entities/address.entity';

export const makeState = (overrides: Record<string, unknown> = {}): StateEntity => {
  return new StateEntity({ id: 'state-1', name: 'São Paulo', uf: 'SP', ...overrides });
};

export const makeCity = (overrides: Record<string, unknown> = {}): CityEntity => {
  return new CityEntity({
    id: '11111111-1111-4111-8111-111111111111',
    name: 'São Paulo',
    state: makeState(),
    ...overrides,
  });
};

export const makeAddress = (overrides: Record<string, unknown> = {}): Address => {
  const address = {
    id: 'address-1',
    cep: '01001000',
    neighborhood: 'Centro',
    street: 'Rua A',
    number: '100',
    complement: null as string | null,
    latitude: null as number | null,
    longitude: null as number | null,
    city: makeCity(),
    createdBy: 'user-1',
    updatedBy: 'user-1',
    deletedBy: null,
    auditable: { createdAt: new Date(), updatedAt: new Date(), deletedAt: null as Date | null },
    ...overrides,
  };
  Object.setPrototypeOf(address, Address.prototype);
  return address as unknown as Address;
};
