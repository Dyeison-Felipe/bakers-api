import { CategoryValidator, CategoryRules } from './category-validator';

describe('CategoryValidator unit tests', () => {
  it('should fail validation when required fields are missing', () => {
    const validator = new CategoryValidator();

    expect(validator.validate({} as any)).toBe(false);
    expect(Object.keys(validator.errors).sort()).toEqual(
      ['name', 'createdBy', 'updatedBy'].sort(),
    );
  });

  it('should pass validation with valid data', () => {
    const validator = new CategoryValidator();
    const validData = {
      name: 'Pães',
      createdBy: 'user-1',
      updatedBy: 'user-1',
    };

    expect(validator.validate(validData as any)).toBe(true);
    expect(validator.errors).toEqual({});
    expect(validator.validatedData).toBeInstanceOf(CategoryRules);
  });
});
