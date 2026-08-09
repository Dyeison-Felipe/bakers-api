import { CreateAddressUseCase } from '../usecase/create-address.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { makeCity } from './fixtures';
import type { AddressRepository } from '../../domain/repositories/address.repository';
import type { CityRepository } from '@/core/city/domain/repositories/city.repository';

describe('CreateAddressUseCase', () => {
  let addressRepository: jest.Mocked<Pick<AddressRepository, 'save'>>;
  let cityRepository: jest.Mocked<Pick<CityRepository, 'findById'>>;
  let sut: CreateAddressUseCase;

  const input = {
    cep: '01001000',
    neighborhood: 'Centro',
    street: 'Rua A',
    number: '100',
    complement: null,
    latitude: null,
    longitude: null,
    cityId: '11111111-1111-4111-8111-111111111111',
  };

  beforeEach(() => {
    addressRepository = { save: jest.fn().mockImplementation(async (a) => a) };
    cityRepository = { findById: jest.fn().mockResolvedValue(makeCity()) };

    sut = new CreateAddressUseCase(
      addressRepository as unknown as AddressRepository,
      cityRepository as unknown as CityRepository,
    );
  });

  it('should throw NotFoundError when the city does not exist', async () => {
    cityRepository.findById.mockResolvedValue(null);

    await expect(sut.execute(input as never)).rejects.toThrow(NotFoundError);
  });

  it('should create the address and return the mapped output', async () => {
    const output = await sut.execute(input as never);

    expect(output).toEqual({
      id: expect.any(String),
      cep: '01001000',
      neighborhood: 'Centro',
      street: 'Rua A',
      number: '100',
      complement: null,
      latitude: null,
      longitude: null,
      city: {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'São Paulo',
        state: { id: 'state-1', name: 'São Paulo', uf: 'SP' },
      },
    });
  });
});
