import { AdditionalCostValidator, AdditionalCostRules } from './additional-cost-validator';

describe('AdditionalCostValidator unit tests', () => {
  it('should fail validation when required fields are missing', () => {
    const validator = new AdditionalCostValidator();

    expect(validator.validate({} as any)).toBe(false);
    expect(Object.keys(validator.errors).sort()).toEqual(
      ['name', 'createdBy', 'updatedBy'].sort(),
    );
  });

  it('should pass validation with valid data', () => {
    const validator = new AdditionalCostValidator();
    const validData = {
      name: 'Frete',
      createdBy: 'user-1',
      updatedBy: 'user-1',
    };

    expect(validator.validate(validData as any)).toBe(true);
    expect(validator.errors).toEqual({});
    expect(validator.validatedData).toBeInstanceOf(AdditionalCostRules);
  });
});
