import { FindAllStateUseCase } from '../usecase/find-all-state.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { StateEntity } from '../../domain/entities/state.entity';
import type { StateRepository } from '../../domain/repositories/state.repository';

describe('FindAllStateUseCase', () => {
  let stateRepository: jest.Mocked<Pick<StateRepository, 'search'>>;
  let sut: FindAllStateUseCase;

  beforeEach(() => {
    stateRepository = { search: jest.fn() };

    sut = new FindAllStateUseCase(stateRepository as unknown as StateRepository);
  });

  it('should throw NotFoundError when no state is found', async () => {
    stateRepository.search.mockResolvedValue([]);

    await expect(sut.execute({ search: 'xx' })).rejects.toThrow(NotFoundError);
  });

  it('should map each state to the output shape', async () => {
    stateRepository.search.mockResolvedValue([
      new StateEntity({ id: 'state-1', name: 'São Paulo', uf: 'SP' }),
    ]);

    const output = await sut.execute({ search: 'São' });

    expect(output).toEqual([{ id: 'state-1', name: 'São Paulo', uf: 'SP' }]);
  });
});
