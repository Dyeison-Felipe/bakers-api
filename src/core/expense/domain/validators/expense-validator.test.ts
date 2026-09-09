import { ExpenseValidator, ExpenseRules } from './expense-validator';

describe('ExpenseValidator unit tests', () => {
  it('should fail validation when required fields are missing', () => {
    const validator = new ExpenseValidator();

    expect(validator.validate({} as any)).toBe(false);
    expect(Object.keys(validator.errors).sort()).toEqual(
      ['date', 'value', 'description', 'createdBy', 'updatedBy'].sort(),
    );
  });

  it('should pass validation with valid data', () => {
    const validator = new ExpenseValidator();
    const validData = {
      date: new Date('2026-01-01'),
      value: 50.5,
      description: 'Compra de farinha',
      createdBy: 'user-1',
      updatedBy: 'user-1',
    };

    expect(validator.validate(validData as any)).toBe(true);
    expect(validator.errors).toEqual({});
    expect(validator.validatedData).toBeInstanceOf(ExpenseRules);
  });
});
