import { FindAllRolesUseCase } from '../usecase/find-all-roles.usecase';
import type { RoleRepository } from '../../domain/repositories/role.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('FindAllRolesUseCase', () => {
  let roleRepository: jest.Mocked<Pick<RoleRepository, 'findAllByCompany'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: FindAllRolesUseCase;

  beforeEach(() => {
    roleRepository = { findAllByCompany: jest.fn().mockResolvedValue([]) };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue({ company: { id: 'company-1' } }),
      setLoggedUser: jest.fn(),
    } as unknown as jest.Mocked<LoggedUserService>;

    sut = new FindAllRolesUseCase(
      roleRepository as unknown as RoleRepository,
      loggedUserService,
    );
  });

  it('should scope the search by the logged user company id', async () => {
    await sut.execute();

    expect(roleRepository.findAllByCompany).toHaveBeenCalledWith('company-1');
  });

  it('should map each role to the output shape', async () => {
    roleRepository.findAllByCompany.mockResolvedValue([
      { id: 'role-1', name: 'Admin' } as never,
      { id: 'role-2', name: 'Funcionário' } as never,
    ]);

    const output = await sut.execute();

    expect(output).toEqual([
      { id: 'role-1', name: 'Admin' },
      { id: 'role-2', name: 'Funcionário' },
    ]);
  });
});
