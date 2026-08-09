import { SyncNcmUseCase } from '../usecase/sync-ncm.usecase';
import { Ncm } from '../../domain/entities/ncm.entity';
import type { SiscomexService } from '@/shared/application/siscomex/siscomex-ncm.interface';
import type { NcmRepository } from '../../domain/repositories/ncm.repository';

const makeNcm = (overrides: Record<string, unknown> = {}): Ncm => {
  const ncm = {
    id: 'ncm-1',
    code: '19059000',
    description: 'Pão',
    updateDescription(description: string) {
      this.description = description;
    },
    ...overrides,
  };
  Object.setPrototypeOf(ncm, Ncm.prototype);
  return ncm as unknown as Ncm;
};

describe('SyncNcmUseCase', () => {
  let siscomexService: jest.Mocked<SiscomexService>;
  let ncmRepository: jest.Mocked<Pick<NcmRepository, 'findManyByCodes' | 'saveMany'>>;
  let sut: SyncNcmUseCase;

  beforeEach(() => {
    siscomexService = { fetchAll: jest.fn().mockResolvedValue([]) };
    ncmRepository = {
      findManyByCodes: jest.fn().mockResolvedValue([]),
      saveMany: jest.fn().mockResolvedValue(undefined),
    };

    sut = new SyncNcmUseCase(siscomexService, ncmRepository as unknown as NcmRepository);
  });

  it('should do nothing when Siscomex returns no data', async () => {
    await sut.execute();

    expect(ncmRepository.saveMany).not.toHaveBeenCalled();
  });

  it('should create new NCM entities for codes that do not exist yet', async () => {
    siscomexService.fetchAll.mockResolvedValue([{ code: '19059000', description: 'Pão' }]);
    ncmRepository.findManyByCodes.mockResolvedValue([]);

    await sut.execute();

    const saved = ncmRepository.saveMany.mock.calls[0][0];
    expect(saved).toHaveLength(1);
    expect(saved[0].code).toBe('19059000');
  });

  it('should update the description of existing NCM entities instead of duplicating them', async () => {
    const existing = makeNcm({ code: '19059000', description: 'Antigo' });
    siscomexService.fetchAll.mockResolvedValue([{ code: '19059000', description: 'Novo' }]);
    ncmRepository.findManyByCodes.mockResolvedValue([existing]);

    await sut.execute();

    expect(existing.description).toBe('Novo');
    const saved = ncmRepository.saveMany.mock.calls[0][0];
    expect(saved).toEqual([existing]);
  });

  it('should persist records in batches of 100', async () => {
    const rawData = Array.from({ length: 150 }, (_, i) => ({
      code: String(i).padStart(8, '0'),
      description: `Item ${i}`,
    }));
    siscomexService.fetchAll.mockResolvedValue(rawData);
    ncmRepository.findManyByCodes.mockResolvedValue([]);

    await sut.execute();

    expect(ncmRepository.saveMany).toHaveBeenCalledTimes(2);
    expect(ncmRepository.saveMany.mock.calls[0][0]).toHaveLength(100);
    expect(ncmRepository.saveMany.mock.calls[1][0]).toHaveLength(50);
  });

  it('should ignore a concurrent call while a sync is already running', async () => {
    let resolveFetch: (value: { code: string; description: string }[]) => void;
    siscomexService.fetchAll.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    const firstRun = sut.execute();
    const secondRun = sut.execute();

    resolveFetch!([]);
    await Promise.all([firstRun, secondRun]);

    expect(siscomexService.fetchAll).toHaveBeenCalledTimes(1);
  });
});
