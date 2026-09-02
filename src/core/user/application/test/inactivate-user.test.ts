import { InactivateUserUseCase } from '../usecase/inactivate-user.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { makeCompany, makeLoggedUser, makeUser } from './fixtures';
import type { UserRepository } from '../../domain/repositories/user.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('InactivateUserUseCase', () => {
  let userRepository: jest.Mocked<Pick<UserRepository, 'findById' | 'update'>>;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: InactivateUserUseCase;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new InactivateUserUseCase(
      userRepository as unknown as UserRepository,
      loggedUserService,
    );
  });

  it('should throw NotFoundError when the user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(sut.execute({ id: 'user-1' })).rejects.toThrow(NotFoundError);
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('should throw NotFoundError when the user belongs to another company (tenant isolation)', async () => {
    const user = makeUser({ company: makeCompany({ id: 'another-company' }) });
    userRepository.findById.mockResolvedValue(user);

    await expect(sut.execute({ id: user.id })).rejects.toThrow(NotFoundError);
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('should set the user as inactive and persist the change', async () => {
    const user = makeUser({ active: true });
    userRepository.findById.mockResolvedValue(user);

    await sut.execute({ id: user.id });

    expect(user.active).toBe(false);
    expect(userRepository.update).toHaveBeenCalledWith(user);
  });
});
