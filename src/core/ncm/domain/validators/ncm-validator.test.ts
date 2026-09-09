import { NcmValidator, NcmRules } from './ncm-validator';

describe('NcmValidator unit tests', () => {
  it('should fail validation when required fields are missing', () => {
    const validator = new NcmValidator();

    expect(validator.validate({} as any)).toBe(false);
    expect(Object.keys(validator.errors).sort()).toEqual(
      ['code', 'description'].sort(),
    );
  });

  it('should pass validation with valid data', () => {
    const validator = new NcmValidator();
    const validData = {
      code: '1905.90.90',
      description: 'Pão de forma',
    };

    expect(validator.validate(validData as any)).toBe(true);
    expect(validator.errors).toEqual({});
    expect(validator.validatedData).toBeInstanceOf(NcmRules);
  });
});
