import { TransformFnParams } from 'class-transformer';

// Para usar com @Transform em campos opcionais: o frontend manda "" quando o
// usuário deixa o campo em branco, e isso deve virar null (e não falhar em
// validações como @MaxLength/@Matches, que só são puladas para null/undefined).
export const emptyStringToNull = ({ value }: TransformFnParams) =>
  typeof value === 'string' && value.trim() === '' ? null : value;
