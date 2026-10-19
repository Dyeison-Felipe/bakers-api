import { getMetadataStorage, ValidationError } from 'class-validator';
import { FieldsError } from '@/shared/application/validators/validator-field.interface';

// Nome legível (pt-BR) de cada campo validado por DTOs e Rules de domínio.
// Campos fora da lista aparecem com o próprio nome técnico.
export const FIELD_LABELS: Record<string, string> = {
  // genéricos
  id: 'Id',
  name: 'Nome',
  description: 'Descrição',
  active: 'Ativo',
  email: 'E-mail',
  password: 'Senha',
  phoneNumber: 'Telefone',
  createdBy: 'Criado por',
  updatedBy: 'Atualizado por',
  company: 'Empresa',
  code: 'Código',
  token: 'Token',

  // empresa
  fantasyName: 'Nome fantasia',
  socialReazon: 'Razão social',
  cnpj: 'CNPJ',
  stateRegistration: 'Inscrição estadual',
  plan: 'Plano',
  planId: 'Plano',
  planStartedAt: 'Início do plano',
  planExpiresAt: 'Vencimento do plano',
  stripePaymentMethodId: 'Forma de pagamento',
  address: 'Endereço',
  user: 'Usuário administrador',

  // endereço
  cep: 'CEP',
  neighborhood: 'Bairro',
  street: 'Rua',
  number: 'Número',
  complement: 'Complemento',
  latitude: 'Latitude',
  longitude: 'Longitude',
  cityId: 'Cidade',

  // usuário
  username: 'Usuário',
  role: 'Perfil',
  permissionsId: 'Permissões',
  emailVerified: 'E-mail verificado',

  // cliente
  cpf: 'CPF',
  customerCpf: 'CPF do cliente',
  customerId: 'Cliente',

  // plano
  features: 'Recursos',
  price: 'Preço',
  duration: 'Duração',
  userLimit: 'Limite de usuários',
  permissionIds: 'Permissões',

  // produto
  scaleReference: 'Referência de balança',
  barCode: 'Código de barras',
  ncm: 'NCM',
  costPrice: 'Preço de custo',
  unitCostPrice: 'Custo unitário',
  pricePerKilogram: 'Preço por kg',
  salePrice: 'Preço de venda',
  profitPrice: 'Margem de lucro',
  unitOfMeasurement: 'Unidade de medida',
  consumerUnit: 'Unidade de consumo',
  expirationDateInDays: 'Validade (dias)',
  stockManagement: 'Controle de estoque',
  typeProduct: 'Tipo do produto',
  currentStock: 'Estoque atual',
  stockMin: 'Estoque mínimo',
  purchaseUnit: 'Unidade de compra',
  quantity: 'Quantidade',
  weight: 'Peso',
  volume: 'Volume',
  category: 'Categoria',
  additionalCost: 'Custos adicionais',
  additionalCosts: 'Custos adicionais',
  recipeLinks: 'Receitas',
  productDto: 'Produto',
  image: 'Imagem',
  imagePath: 'Imagem',

  // categoria
  parentId: 'Categoria pai',

  // receita
  items: 'Itens',
  material: 'Matéria-prima',

  // despesa
  date: 'Data',
  value: 'Valor',

  // caixa
  openingAmount: 'Valor de abertura',
  amount: 'Valor',
  type: 'Tipo',
  reason: 'Motivo',

  // venda
  paymentMethod: 'Forma de pagamento',
  amountReceived: 'Valor recebido',
  productId: 'Produto',
  weightInKg: 'Peso (kg)',
  unitPrice: 'Preço unitário',

  // produção diária
  productionDate: 'Data da produção',
  plannedQuantity: 'Quantidade planejada',
  recipeMultiplier: 'Multiplicador de receita',

  // estoque
  reasonDescription: 'Observação',
};

export function fieldLabel(path: string): string {
  const last = path.split('.').pop() ?? path;
  // índices de array (items.0.quantity) não têm label próprio
  return FIELD_LABELS[last] ?? FIELD_LABELS[path] ?? last;
}

const formatNumber = (value: unknown) =>
  typeof value === 'number'
    ? value.toLocaleString('pt-BR', { maximumFractionDigits: 6 })
    : String(value);

// Traduz uma constraint do class-validator (chave + argumentos) para pt-BR.
export function translateConstraint(
  key: string,
  args: any[],
  label: string,
): string {
  switch (key) {
    case 'isNotEmpty':
    case 'isDefined':
      return `${label} é obrigatório`;
    case 'isString':
      return `${label} deve ser um texto`;
    case 'isNumber':
    case 'isNumberString':
      return `${label} deve ser um número válido`;
    case 'isInt':
      return `${label} deve ser um número inteiro`;
    case 'isPositive':
      return `${label} deve ser maior que zero`;
    case 'min':
      return `${label} deve ser no mínimo ${formatNumber(args[0])}`;
    case 'max':
      return `${label} deve ser no máximo ${formatNumber(args[0])}`;
    case 'maxLength':
      return `${label} deve ter no máximo ${args[0]} caracteres`;
    case 'minLength':
      return `${label} deve ter no mínimo ${args[0]} caracteres`;
    case 'isLength':
      return args[0] === args[1]
        ? `${label} deve ter ${args[0]} caracteres`
        : `${label} deve ter entre ${args[0]} e ${args[1]} caracteres`;
    case 'isEmail':
      return `${label} inválido`;
    case 'isUUID':
      return `${label} inválido`;
    case 'isEnum':
    case 'isIn':
      return `${label} possui um valor inválido`;
    case 'isBoolean':
      return `${label} deve ser verdadeiro ou falso`;
    case 'isDate':
    case 'isDateString':
      return `${label} deve ser uma data válida`;
    case 'isArray':
      return `${label} deve ser uma lista`;
    case 'arrayMinSize':
      return `${label} deve ter pelo menos ${args[0]} item(ns)`;
    case 'matches':
      return `${label} está em formato inválido`;
    case 'isInstance':
    case 'nestedValidation':
      return `${label} inválido`;
    case 'whitelistValidation':
      return `${label} não é permitido`;
    case 'isCpf':
      return `${label} inválido`;
    case 'isCnpj':
      return `${label} inválido`;
    case 'isEmailDomain':
      return `Domínio de e-mail inexistente`;
    default:
      return `${label} inválido`;
  }
}

type ConstraintInfo = { args: any[]; hasCustomMessage: boolean };

// Lê os argumentos de cada constraint (ex.: 255 em @MaxLength(255)) direto do
// metadata do class-validator, em vez de tentar parsear a mensagem em inglês.
function getConstraintInfo(
  target: object | undefined,
  property: string,
): Record<string, ConstraintInfo> {
  const info: Record<string, ConstraintInfo> = {};
  if (!target) return info;

  const metadatas = getMetadataStorage().getTargetValidationMetadatas(
    target.constructor,
    '',
    true,
    false,
  );

  for (const meta of metadatas) {
    if (meta.propertyName !== property) continue;
    const key = meta.name ?? meta.type;
    info[key] = {
      args: meta.constraints ?? [],
      hasCustomMessage: meta.message !== undefined && meta.message !== '',
    };
  }

  return info;
}

// Achata os erros do class-validator (incluindo filhos aninhados, ex.:
// address.cep, items.0.quantity) em { campo: [mensagens em pt-BR] }.
export function flattenValidationErrors(
  errors: ValidationError[],
  prefix = '',
  result: FieldsError = {},
): FieldsError {
  for (const error of errors) {
    const path = prefix ? `${prefix}.${error.property}` : error.property;

    if (error.constraints) {
      const info = getConstraintInfo(error.target, error.property);
      const label = fieldLabel(path);

      // Campo vazio: só "X é obrigatório" (as demais regras — tamanho,
      // formato, tipo — falham junto e só poluiriam a mensagem).
      const isEmpty =
        error.value === undefined || error.value === null || error.value === '';
      const requiredKey = ['isNotEmpty', 'isDefined'].find(
        (key) => key in error.constraints!,
      );
      const constraints = Object.entries(error.constraints).filter(
        ([key]) => !(isEmpty && requiredKey) || key === requiredKey,
      );

      result[path] = constraints.map(([key, original]) =>
        info[key]?.hasCustomMessage
          ? original
          : translateConstraint(key, info[key]?.args ?? [], label),
      );
    }

    if (error.children?.length) {
      flattenValidationErrors(error.children, path, result);
    }
  }

  return result;
}

export function firstErrorMessage(errors: FieldsError): string {
  for (const messages of Object.values(errors)) {
    if (messages?.length) return messages[0];
  }
  return 'Dados inválidos';
}
