// Validação de CPF/CNPJ pelo dígito verificador (algoritmo da Receita).
// Não consulta nenhuma base externa: confirma que o número é matematicamente
// válido, o que barra erros de digitação e números inventados.

const onlyDigits = (value: string) => value.replace(/\D/g, '');

const isRepeatedSequence = (digits: string) => /^(\d)\1+$/.test(digits);

export function isValidCpf(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || isRepeatedSequence(cpf)) return false;

  const calcDigit = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += Number(cpf[i]) * (length + 1 - i);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return calcDigit(9) === Number(cpf[9]) && calcDigit(10) === Number(cpf[10]);
}

export function isValidCnpj(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14 || isRepeatedSequence(cnpj)) return false;

  const calcDigit = (length: number) => {
    const weights =
      length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += Number(cnpj[i]) * weights[i];
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  return (
    calcDigit(12) === Number(cnpj[12]) && calcDigit(13) === Number(cnpj[13])
  );
}
