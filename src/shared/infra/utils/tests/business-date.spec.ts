import {
  endOfBusinessDate,
  startOfBusinessDay,
  toBusinessDateString,
} from '../business-date';
import { parseDateOnly, parseDateOnlyEndOfDay } from '../parse-date-only';
import { formatDateOnly } from '../format-date-only';
import { getBusinessTodayRange } from '../get-business-today-range';
import { DateOnlyColumnTransformer } from '@/shared/infra/database/typeorm/transformers/date-only.transformer';

// 22h do dia 09 em Brasília = 01h do dia 10 em UTC: o horário que causava o bug.
const lateNightInBrasilia = new Date('2026-11-10T01:00:00.000Z');

describe('business-date', () => {
  it('should take the day in Brasília, not in UTC', () => {
    expect(toBusinessDateString(lateNightInBrasilia)).toBe('2026-11-09');
    expect(formatDateOnly(lateNightInBrasilia)).toBe('2026-11-09');
  });

  it('should return the Brasília midnight of the instant day', () => {
    expect(startOfBusinessDay(lateNightInBrasilia).toISOString()).toBe(
      '2026-11-09T03:00:00.000Z',
    );
  });

  it('should parse YYYY-MM-DD as the whole day in Brasília', () => {
    expect(parseDateOnly('2026-11-09').toISOString()).toBe(
      '2026-11-09T03:00:00.000Z',
    );
    expect(parseDateOnlyEndOfDay('2026-11-09').toISOString()).toBe(
      '2026-11-10T02:59:59.999Z',
    );
    expect(endOfBusinessDate('2026-11-09').getTime()).toBeGreaterThan(
      lateNightInBrasilia.getTime(),
    );
  });

  it('should reject a malformed date', () => {
    expect(() => parseDateOnly('09/11/2026')).toThrow();
  });

  it('should build today range in Brasília at 22h', () => {
    const { startOfDay, endOfDay } = getBusinessTodayRange(lateNightInBrasilia);

    expect(startOfDay.toISOString()).toBe('2026-11-09T03:00:00.000Z');
    expect(endOfDay.toISOString()).toBe('2026-11-10T02:59:59.999Z');
  });

  describe('DateOnlyColumnTransformer', () => {
    const transformer = new DateOnlyColumnTransformer();

    it('should save the Brasília day', () => {
      expect(transformer.to(lateNightInBrasilia)).toBe('2026-11-09');
    });

    it('should read a YYYY-MM-DD as Brasília midnight and save it back unchanged', () => {
      const read = transformer.from('2026-11-09')!;

      expect(read.toISOString()).toBe('2026-11-09T03:00:00.000Z');
      expect(transformer.to(read)).toBe('2026-11-09');
    });
  });
});
