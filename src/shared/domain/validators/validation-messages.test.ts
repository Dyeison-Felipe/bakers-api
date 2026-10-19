import { plainToInstance, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  ValidateNested,
  validateSync,
} from 'class-validator';
import { flattenValidationErrors, firstErrorMessage } from './validation-messages';

class AddressStub {
  @IsString()
  @IsNotEmpty()
  street: string;
}

class Stub {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5)
  name: string;

  @IsNumber()
  @Max(100)
  costPrice: number;

  @Max(10, { message: 'mensagem customizada' })
  quantity: number;

  @ValidateNested()
  @Type(() => AddressStub)
  address: AddressStub;
}

describe('flattenValidationErrors', () => {
  it('should translate constraints to Portuguese using field labels and constraint args', () => {
    const data = plainToInstance(Stub, {
      name: 'nome muito grande',
      costPrice: 1000,
      quantity: 50,
      address: { street: '' },
    });

    const errors = flattenValidationErrors(validateSync(data));

    expect(errors.name).toEqual(['Nome deve ter no máximo 5 caracteres']);
    expect(errors.costPrice).toEqual(['Preço de custo deve ser no máximo 100']);
    expect(errors.quantity).toEqual(['mensagem customizada']);
    expect(errors['address.street']).toEqual(['Rua é obrigatório']);
    expect(firstErrorMessage(errors)).toBe('Nome deve ter no máximo 5 caracteres');
  });
});
