import {
  CompanySubscriptionValidator,
  CompanySubscriptionRules,
} from './company-subscription-validator';

describe('CompanySubscriptionValidator unit tests', () => {
  it('should fail validation when required fields are missing', () => {
    const validator = new CompanySubscriptionValidator();

    expect(validator.validate({} as any)).toBe(false);
    expect(Object.keys(validator.errors).sort()).toEqual(
      [
        'company',
        'plan',
        'stripeSubscriptionId',
        'stripeCustomerId',
        'status',
        'payerEmail',
      ].sort(),
    );
  });

  it('should pass validation with valid data', () => {
    const validator = new CompanySubscriptionValidator();
    const validData = {
      company: { id: 'company-1' },
      plan: { id: 'plan-1' },
      stripeSubscriptionId: 'sub_123',
      stripeCustomerId: 'cus_123',
      status: 'active',
      payerEmail: 'financeiro@padariasabor.com',
    };

    expect(validator.validate(validData as any)).toBe(true);
    expect(validator.errors).toEqual({});
    expect(validator.validatedData).toBeInstanceOf(CompanySubscriptionRules);
  });
});
