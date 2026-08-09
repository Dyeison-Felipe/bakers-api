import { UpdateAddressUseCase } from '../usecase/update-address.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { makeAddress, makeCity } from './fixtures';
import type { AddressRepository } from '../../domain/repositories/address.repository';
import type { CityRepository } from '@/core/city/domain/repositories/city.repository';

describe('UpdateAddressUseCase', () => {
  let addressRepository: jest.Mocked<Pick<AddressRepository, 'findById' | 'save'>>;
  let cityRepository: jest.Mocked<Pick<CityRepository, 'findById'>>;
  let sut: UpdateAddressUseCase;

  const input = {
    id: 'address-1',
    cep: '02002000',
    neighborhood: 'Bairro Novo',
    street: 'Rua B',
    number: '200',
    complement: 'Apto 1',
    latitude: -23.5,
    longitude: -46.6,
    cityId: '22222222-2222-4222-8222-222222222222',
  };

  beforeEach(() => {
    addressRepository = {
      findById: jest.fn().mockResolvedValue(makeAddress()),
      save: jest.fn().mockImplementation(async (a) => a),
    };
    cityRepository = {
      findById: jest.fn().mockResolvedValue(
        makeCity({ id: '22222222-2222-4222-8222-222222222222', name: 'Campinas' }),
      ),
    };

    sut = new UpdateAddressUseCase(
      addressRepository as unknown as AddressRepository,
      cityRepository as unknown as CityRepository,
    );
  });

  it('should throw NotFoundError when the address does not exist', async () => {
    addressRepository.findById.mockResolvedValue(null);

    await expect(sut.execute(input as never)).rejects.toThrow(NotFoundError);
  });

  it('should throw NotFoundError when the city does not exist', async () => {
    cityRepository.findById.mockResolvedValue(null);

    await expect(sut.execute(input as never)).rejects.toThrow(NotFoundError);
  });

  it('should update the address fields and the city, returning the mapped output', async () => {
    const output = await sut.execute(input as never);

    expect(output).toEqual({
      id: 'address-1',
      cep: '02002000',
      neighborhood: 'Bairro Novo',
      street: 'Rua B',
      number: '200',
      complement: 'Apto 1',
      latitude: -23.5,
      longitude: -46.6,
      city: {
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Campinas',
        state: { id: 'state-1', name: 'São Paulo', uf: 'SP' },
      },
    });
  });
});
