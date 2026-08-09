import { SearchCityPaginatedUseCase } from '../usecase/search-city-paginated.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { CityEntity } from '../../domain/entities/city.entity';
import { StateEntity } from '@/core/state/domain/entities/state.entity';
import type { CityRepository } from '../../domain/repositories/city.repository';

describe('SearchCityPaginatedUseCase', () => {
  let cityRepository: jest.Mocked<Pick<CityRepository, 'search'>>;
  let sut: SearchCityPaginatedUseCase;

  beforeEach(() => {
    cityRepository = { search: jest.fn() };

    sut = new SearchCityPaginatedUseCase(cityRepository as unknown as CityRepository);
  });

  it('should throw NotFoundError when no city is found', async () => {
    cityRepository.search.mockResolvedValue([]);

    await expect(sut.execute({ state: 'SP' })).rejects.toThrow(NotFoundError);
  });

  it('should map each city to the output shape', async () => {
    const state = new StateEntity({ id: 'state-1', name: 'São Paulo', uf: 'SP' });
    cityRepository.search.mockResolvedValue([
      new CityEntity({ id: 'city-1', name: 'São Paulo', state }),
    ]);

    const output = await sut.execute({ state: 'SP' });

    expect(output).toEqual([{ id: 'city-1', name: 'São Paulo' }]);
  });
});
