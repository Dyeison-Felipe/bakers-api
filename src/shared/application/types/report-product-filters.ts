import { TypeProduct } from '@/shared/infra/enums/product';

// Filtros opcionais de produto aplicados aos relatórios de Desperdício,
// Produção, CPV, Margem de Contribuição e Curva ABC. Não aplicado ao
// relatório de Caixa (soma o dia inteiro, sem granularidade por produto) nem
// ao de Despesas (não tem produto).
export type ReportProductFilters = {
  productId?: string;
  categoryId?: string;
  typeProduct?: TypeProduct;
};
