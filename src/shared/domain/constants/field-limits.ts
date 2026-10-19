// Limites numéricos derivados das colunas do banco. Qualquer valor acima
// disso estoura o `decimal(p,s)` do Postgres ("numeric field overflow"),
// então DTOs, validators de domínio e o frontend (`bakers-web/src/utils/limits.ts`)
// usam os mesmos números.

// decimal(10,2): preços, valores em dinheiro, totais
export const MONEY_MAX = 99_999_999.99;

// decimal(10,3): quantidade, peso, volume, estoque, produção
export const QUANTITY_MAX = 9_999_999.999;

// decimal(12,6): custo unitário com 6 casas
export const UNIT_COST_MAX = 999_999.999999;

// decimal(10,2) usado como percentual de lucro (margem)
export const PERCENT_MAX = 9_999.99;

// Inteiros de plano (int no banco, mas com teto de bom senso)
export const PLAN_DURATION_MAX_DAYS = 36_500;
export const PLAN_USER_LIMIT_MAX = 100_000;
