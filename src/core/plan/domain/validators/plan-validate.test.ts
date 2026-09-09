import { PlanValidator, PlanRules } from './plan-validate';

describe('PlanValidator unit tests', () => {
  it('should fail validation when required fields are missing', () => {
    const validator = new PlanValidator();

    expect(validator.validate({} as any)).toBe(false);
    expect(Object.keys(validator.errors).sort()).toEqual(
      ['name', 'description', 'price', 'active', 'duration'].sort(),
    );
  });

  it('should pass validation with valid data', () => {
    const validator = new PlanValidator();
    const validData = {
      name: 'Plano Básico',
      description: 'Plano para pequenas padarias',
      price: 49.9,
      active: true,
      duration: 30,
      userLimit: 5,
    };

    expect(validator.validate(validData as any)).toBe(true);
    expect(validator.errors).toEqual({});
    expect(validator.validatedData).toBeInstanceOf(PlanRules);
  });
});
