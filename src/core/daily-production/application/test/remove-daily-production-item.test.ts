import { RemoveDailyProductionItemUseCase } from '../usecase/remove-daily-production-item.usecase';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import {
  TypeDailyProductionItemStatus,
  TypeDailyProductionStatus,
} from '@/shared/infra/enums/daily-production';
import { makeCompany, makeDailyProduction, makeItem, makeLoggedUser } from './fixtures';
import type { DailyProductionItemRepository } from '../../domain/repositories/daily-production-item.repository';
import type { LoggedUserService } from '@/shared/application/logged-user/logged-user.service';

describe('RemoveDailyProductionItemUseCase', () => {
  let dailyProductionItemRepository: jest.Mocked<
    Pick<DailyProductionItemRepository, 'findByIdWithDailyProduction' | 'delete'>
  >;
  let loggedUserService: jest.Mocked<LoggedUserService>;
  let sut: RemoveDailyProductionItemUseCase;

  beforeEach(() => {
    dailyProductionItemRepository = {
      findByIdWithDailyProduction: jest.fn().mockResolvedValue(makeItem()),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    loggedUserService = {
      getLoggedUser: jest.fn().mockReturnValue(makeLoggedUser()),
      setLoggedUser: jest.fn(),
    };

    sut = new RemoveDailyProductionItemUseCase(
      dailyProductionItemRepository as unknown as DailyProductionItemRepository,
      loggedUserService,
    );
  });

  it('should throw NotFoundError when the item does not exist or belongs to another company', async () => {
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(
      makeItem({ dailyProduction: makeDailyProduction({ company: makeCompany({ id: 'other' }) }) }),
    );

    await expect(sut.execute({ id: 'item-1' })).rejects.toThrow(NotFoundError);
  });

  it('should throw BadRequestError when the item is already produced', async () => {
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(
      makeItem({ status: TypeDailyProductionItemStatus.PRODUCED }),
    );

    await expect(sut.execute({ id: 'item-1' })).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when the daily production is already completed', async () => {
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(
      makeItem({
        dailyProduction: makeDailyProduction({ status: TypeDailyProductionStatus.COMPLETED }),
      }),
    );

    await expect(sut.execute({ id: 'item-1' })).rejects.toThrow(BadRequestError);
  });

  it('should delete the item', async () => {
    const item = makeItem();
    dailyProductionItemRepository.findByIdWithDailyProduction.mockResolvedValue(item);

    const output = await sut.execute({ id: item.id });

    expect(output).toEqual({ id: item.id });
    expect(dailyProductionItemRepository.delete).toHaveBeenCalledWith(item.id);
  });
});
