import { RoleValidator, RoleRules } from './role-validators';

describe('RoleValidator unit tests', () => {
  it('should fail validation when required fields are missing', () => {
    const validator = new RoleValidator();

    expect(validator.validate({} as any)).toBe(false);
    expect(Object.keys(validator.errors).sort()).toEqual(
      ['name', 'company', 'createdBy', 'updatedBy'].sort(),
    );
  });

  it('should pass validation with valid data', () => {
    const validator = new RoleValidator();
    const validData = {
      name: 'Gerente',
      company: { id: 'company-1' },
      createdBy: 'user-1',
      updatedBy: 'user-1',
    };

    expect(validator.validate(validData as any)).toBe(true);
    expect(validator.errors).toEqual({});
    expect(validator.validatedData).toBeInstanceOf(RoleRules);
  });
});
