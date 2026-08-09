import { FindAddressByCompanyIdUseCase } from '../usecase/find-address-by-id.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { makeAddress } from './fixtures';
import type { AddressRepository } from '../../domain/repositories/address.repository';

describe('FindAddressByCompanyIdUseCase', () => {
  let addressRepository: jest.Mocked<Pick<AddressRepository, 'findById'>>;
  let sut: FindAddressByCompanyIdUseCase;

  beforeEach(() => {
    addressRepository = { findById: jest.fn() };

    sut = new FindAddressByCompanyIdUseCase(addressRepository as unknown as AddressRepository);
  });

  it('should throw NotFoundError when the address does not exist', async () => {
    addressRepository.findById.mockResolvedValue(null);

    await expect(sut.execute({ id: 'address-1' })).rejects.toThrow(NotFoundError);
  });

  it('should map the address and its city/state to the output shape', async () => {
    addressRepository.findById.mockResolvedValue(makeAddress());

    const output = await sut.execute({ id: 'address-1' });

    expect(output).toEqual({
      id: 'address-1',
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
