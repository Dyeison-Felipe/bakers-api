import * as libClassValidator from 'class-validator';
import { ClassValidatorFields } from '../../class-validator-field';

type StubProps = {
  field: string;
};

class StubClassValidatorFields extends ClassValidatorFields<StubProps> {}

describe('ClassValidatorFields unit test', () => {
  it('Should initialized errors and validateDate variables with null', () => {
    const sut = new StubClassValidatorFields();

    expect(sut.errors).toMatchObject({});
    expect(sut.validatedData).toMatchObject({});
  });

  it('Should validate with errors', () => {
    const spyValidateSync = jest.spyOn(libClassValidator, 'validateSync');
    spyValidateSync.mockReturnValue([
      {
        property: 'field',
        constraints: { isNotEmpty: 'field should not be empty' },
      },
    ]);
    const sut = new StubClassValidatorFields();

    expect(sut.validate(null)).toBeFalsy();
    expect(spyValidateSync).toHaveBeenCalled();
    expect(sut.validatedData).toMatchObject({});
    // sem metadata para o alvo, a constraint é traduzida pelo nome do campo
    expect(sut.errors).toStrictEqual({ field: ['field é obrigatório'] });
  });

  it('Should validate without errors', () => {
    const spyValidateSync = jest.spyOn(libClassValidator, 'validateSync');
    spyValidateSync.mockReturnValue([]);
    const sut = new StubClassValidatorFields();

    expect(sut.validate({ field: 'value' })).toBeTruthy();
    expect(spyValidateSync).toHaveBeenCalled();
    expect(sut.validatedData).toStrictEqual({ field: 'value' });
    expect(sut.errors).toMatchObject({});
  });
});
