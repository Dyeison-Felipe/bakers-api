import { FindCompanyUseCase } from '../usecase/find-company.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { makeCompany, makeLoggedUser } from './fixtures';
import type { CompanyRepository } from '../../domain/repositories/company.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('FindCompanyUseCase', () => {
  let companyRepository: jest.Mocked<Pick<CompanyRepository, 'findById'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindCompanyUseCase;

  beforeEach(() => {
    companyRepository = { findById: jest.fn() };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new FindCompanyUseCase(
      companyRepository as unknown as CompanyRepository,
      loggedUserService,
    );
  });

  it('should throw NotFoundError when the logged user company does not exist', async () => {
    companyRepository.findById.mockResolvedValue(null);

    await expect(sut.execute()).rejects.toThrow(NotFoundError);
  });

  it('should look up the company by the logged user company id', async () => {
    companyRepository.findById.mockResolvedValue(makeCompany());

    await sut.execute();

    expect(companyRepository.findById).toHaveBeenCalledWith('company-1');
  });

  it('should return the company detail output', async () => {
    const company = makeCompany({ fantasyName: 'Padaria Y' });
    companyRepository.findById.mockResolvedValue(company);

    const output = await sut.execute();

    expect(output).toMatchObject({
      id: company.id,
      fantasyName: 'Padaria Y',
      cnpj: company.cnpj,
    });
  });
});
