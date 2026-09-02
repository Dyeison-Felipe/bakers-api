import { daysToMercadoPagoFrequency } from '../helpers/frequency.helper';

describe('daysToMercadoPagoFrequency', () => {
  it('should convert a duration that is a multiple of 30 into months', () => {
    expect(daysToMercadoPagoFrequency(30)).toEqual({
      frequency: 1,
      frequencyType: 'months',
    });
    expect(daysToMercadoPagoFrequency(180)).toEqual({
      frequency: 6,
      frequencyType: 'months',
    });
    expect(daysToMercadoPagoFrequency(365)).toEqual({
      frequency: 365,
      frequencyType: 'days',
    });
  });

  it('should keep a duration that is not a multiple of 30 in days', () => {
    expect(daysToMercadoPagoFrequency(15)).toEqual({
      frequency: 15,
      frequencyType: 'days',
    });
    expect(daysToMercadoPagoFrequency(7)).toEqual({
      frequency: 7,
      frequencyType: 'days',
    });
  });
});
