import { UpdateCompanyUseCase } from '../usecase/update-company.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { ConflictError } from '@/shared/application/errors/conflict-error';
import { makeAddress, makeCity, makeCompany, makeLoggedUser } from './fixtures';
import type { CompanyRepository } from '../../domain/repositories/company.repository';
import type { AddressRepository } from '@/core/address/domain/repositories/address.repository';
import type { CityRepository } from '@/core/city/domain/repositories/city.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('UpdateCompanyUseCase', () => {
  let companyRepository: jest.Mocked<
    Pick<CompanyRepository, 'findById' | 'findByCnpj' | 'update'>
  >;
  let addressRepository: jest.Mocked<Pick<AddressRepository, 'update'>>;
  let cityRepository: jest.Mocked<Pick<CityRepository, 'findById'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: UpdateCompanyUseCase;

  const baseInput = {
    fantasyName: 'Padaria Nova',
    socialReazon: 'Padaria Nova LTDA',
    cnpj: '12345678000190',
    stateRegistration: '123456',
    email: 'novo@padaria.com',
    phoneNumber: '42999998888',
    address: {
      cep: '80000000',
      street: 'Rua Nova',
      number: '200',
      neighborhood: 'Centro',
      cityId: '11111111-1111-4111-8111-111111111111',
    },
  };

  beforeEach(() => {
    companyRepository = {
      findById: jest.fn().mockResolvedValue(makeCompany({ cnpj: '12345678000190' })),
      findByCnpj: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };
    addressRepository = { update: jest.fn().mockResolvedValue(undefined) };
    cityRepository = { findById: jest.fn().mockResolvedValue(makeCity()) };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new UpdateCompanyUseCase(
      companyRepository as unknown as CompanyRepository,
      addressRepository as unknown as AddressRepository,
      cityRepository as unknown as CityRepository,
      loggedUserService,
    );
  });

  it('should throw NotFoundError when the logged user company does not exist', async () => {
    companyRepository.findById.mockResolvedValue(null);

    await expect(sut.execute(baseInput)).rejects.toThrow(NotFoundError);
  });

  it('should not check CNPJ uniqueness when the CNPJ is unchanged', async () => {
    const company = makeCompany({ cnpj: '12345678000190' });
    companyRepository.findById.mockResolvedValue(company);

    await sut.execute(baseInput);

    expect(companyRepository.findByCnpj).not.toHaveBeenCalled();
  });

  it('should throw ConflictError when the new CNPJ belongs to a different company', async () => {
    const company = makeCompany({ id: 'company-1', cnpj: '00000000000000' });
    companyRepository.findById.mockResolvedValue(company);
    companyRepository.findByCnpj.mockResolvedValue(
      makeCompany({ id: 'other-company', cnpj: '12345678000190' }),
    );

    await expect(sut.execute(baseInput)).rejects.toThrow(ConflictError);
  });

  it('should allow the CNPJ change when the match found is the same company', async () => {
    const company = makeCompany({ id: 'company-1', cnpj: '00000000000000' });
    companyRepository.findById.mockResolvedValue(company);
    companyRepository.findByCnpj.mockResolvedValue(
      makeCompany({ id: 'company-1', cnpj: '12345678000190' }),
    );

    await expect(sut.execute(baseInput)).resolves.toBeDefined();
  });

  it('should not touch the address when the company has none', async () => {
    const company = makeCompany({ address: null });
    companyRepository.findById.mockResolvedValue(company);

    await sut.execute(baseInput);

    expect(cityRepository.findById).not.toHaveBeenCalled();
    expect(addressRepository.update).not.toHaveBeenCalled();
  });

  it('should throw NotFoundError when the new address city does not exist', async () => {
    const company = makeCompany({ address: makeAddress() });
    companyRepository.findById.mockResolvedValue(company);
    cityRepository.findById.mockResolvedValue(null);

    await expect(sut.execute(baseInput)).rejects.toThrow(NotFoundError);
  });

  it('should update the address fields and persist them', async () => {
    const address = makeAddress();
    const company = makeCompany({ address });
    companyRepository.findById.mockResolvedValue(company);

    await sut.execute(baseInput);

    expect(address.street).toBe('Rua Nova');
    expect(address.number).toBe('200');
    expect(addressRepository.update).toHaveBeenCalledWith(address);
  });

  it('should update the company fields and persist them', async () => {
    const company = makeCompany({ address: null, fantasyName: 'Antigo' });
    companyRepository.findById.mockResolvedValue(company);

    const output = await sut.execute(baseInput);

    expect(output.fantasyName).toBe('Padaria Nova');
    expect(companyRepository.update).toHaveBeenCalledWith(company);
  });
});
