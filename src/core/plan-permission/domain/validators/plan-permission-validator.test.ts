import { PlanPermissionValidator, PlanPermissionRules } from './plan-permission-validator';

describe('PlanPermissionValidator unit tests', () => {
  it('should fail validation when required fields are missing', () => {
    const validator = new PlanPermissionValidator();

    expect(validator.validate({} as any)).toBe(false);
    expect(Object.keys(validator.errors).sort()).toEqual(
      ['plan', 'permission'].sort(),
    );
  });

  it('should pass validation with valid data', () => {
    const validator = new PlanPermissionValidator();
    const validData = {
      plan: { id: 'plan-1' },
      permission: { id: 'permission-1' },
    };

    expect(validator.validate(validData as any)).toBe(true);
    expect(validator.errors).toEqual({});
    expect(validator.validatedData).toBeInstanceOf(PlanPermissionRules);
  });
});
