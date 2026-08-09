import { CalculateUnitCostUseCase } from '../usecase/calculate-unit-cost.usecase';
import { TypeProduct, TypeUnitOfMeasurement } from '@/shared/infra/enums/product';

describe('CalculateUnitCostUseCase', () => {
  let sut: CalculateUnitCostUseCase;

  beforeEach(() => {
    sut = new CalculateUnitCostUseCase();
  });

  it('should calculate unit cost for a raw material by dividing cost by quantity', () => {
    const output = sut.execute({
      typeProduct: TypeProduct.RAW_MATERIAL,
      costPrice: 100,
      quantity: 10,
    });

    expect(output.unitCostPrice).toBe(10);
  });

  it('should return null unit cost when quantity is missing', () => {
    const output = sut.execute({
      typeProduct: TypeProduct.RAW_MATERIAL,
      costPrice: 100,
    });

    expect(output).toEqual({ unitCostPrice: null, pricePerKilogram: null });
  });

  it('should calculate pricePerKilogram for own-production using weight', () => {
    const output = sut.execute({
      typeProduct: TypeProduct.OWN_PRODUCTION,
      costPrice: 100,
      quantity: 10,
      weight: 5,
    });

    expect(output.unitCostPrice).toBe(10);
    expect(output.pricePerKilogram).toBe(20);
  });

  it('should lock quantity to 100 for own-production sold by CT', () => {
    const output = sut.execute({
      typeProduct: TypeProduct.OWN_PRODUCTION,
      costPrice: 200,
      quantity: 3,
      unitOfMeasurement: TypeUnitOfMeasurement.CT,
    });

    expect(output.unitCostPrice).toBe(2); // 200 / 100, ignores the quantity=3 sent
  });

  it('should return nulls for an unmapped type product', () => {
    const output = sut.execute({
      typeProduct: 'UNKNOWN' as TypeProduct,
      costPrice: 100,
    });

    expect(output).toEqual({ unitCostPrice: null, pricePerKilogram: null });
  });
});
