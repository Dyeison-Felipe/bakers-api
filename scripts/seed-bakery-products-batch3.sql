-- Terceira leva de seed: mais matérias-primas, 2 novas categorias
-- (Bebidas, Guloseimas), 28 novos produtos de produção própria
-- (salgados fritos/assados, doces variados) com suas receitas, e
-- 25 novos produtos de revenda (bebidas e guloseimas de marca).
-- Complementa seed-bakery-products.sql + seed-bakery-products-batch2.sql
-- (reaproveita matérias-primas e categorias já criadas por eles; roda depois
-- deles). Usa o mecanismo correto de receita (recipe + recipe_item +
-- product_recipe_link), o mesmo que seed-bakery-products-fix-recipes.sql
-- corrigiu para as levas anteriores.
--
-- Empresa alvo: company.id = '2d8dac1b-082b-42a7-b296-7c19f6be5024'
--
-- Script avulso (não é uma migration TypeORM). Idempotente via
-- ON CONFLICT (id) DO NOTHING: pode ser executado mais de uma vez sem erro
-- de chave duplicada.
--
-- Todos os valores derivados (unit_cost_price, price_per_kilogram, cost_price
-- de receita, profit_price) foram calculados seguindo as mesmas fórmulas de
-- ProductUnitCostCalculator / ProductRecipeCostCalculator /
-- ProductProfitCalculator usadas pelo CreateProductUseCase.
--
-- IMPORTANTE: ajuste o schema abaixo (DB_SCHEMA do .env) se for diferente de
-- 'bakers_bill' no seu ambiente.

SET search_path TO bakers_bill;

-- =========================================================================
-- 1. NOVAS CATEGORIAS
-- =========================================================================

INSERT INTO category (id, name, company, created_by, updated_by)
VALUES
  ('c0000000-0000-4000-8000-000000000006', 'Bebidas', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('c0000000-0000-4000-8000-000000000007', 'Guloseimas', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1))
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 2. NOVAS MATÉRIAS-PRIMAS
-- =========================================================================
-- unit_cost_price = cost_price / quantity
-- price_per_kilogram = unit_cost_price / weight (consumer_unit=kg) ou / volume (ml); NULL se un.

INSERT INTO product (
  id, name, ncm, cost_price, unit_cost_price, price_per_kilogram,
  unit_of_measurement, consumer_unit, purchase_unit, quantity, weight, volume,
  type_product, stock_management, active, category, company, created_by, updated_by
)
VALUES
  ('a0000000-0000-4000-8000-000000000025', 'Carne Moída Temperada', '16025000', 45.00, 45.00, 15.00,
   'kg', 'kg', 'pct', 1, 3.000, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('a0000000-0000-4000-8000-000000000026', 'Massa de Pastel (kg)', '19023000', 18.00, 18.00, 6.00,
   'kg', 'kg', 'pct', 1, 3.000, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('a0000000-0000-4000-8000-000000000027', 'Catupiry (Requeijão Culinário)', '04061090', 32.00, 32.00, 16.00,
   'kg', 'kg', 'cx', 1, 2.000, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('a0000000-0000-4000-8000-000000000028', 'Massa Folhada Pronta', '19059090', 24.00, 24.00, 12.00,
   'kg', 'kg', 'pct', 1, 2.000, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('a0000000-0000-4000-8000-000000000029', 'Palmito em Conserva', '20089900', 28.00, 28.00, 28.00,
   'kg', 'kg', 'un', 1, 1.000, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('a0000000-0000-4000-8000-000000000030', 'Carne em Cubos Temperada (Espeto)', '02023000', 50.00, 50.00, 20.00,
   'kg', 'kg', 'pct', 1, 2.500, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('a0000000-0000-4000-8000-000000000031', 'Café em Pó Torrado (Insumo)', '09012100', 22.00, 22.00, 44.00,
   'kg', 'kg', 'pct', 1, 0.500, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('a0000000-0000-4000-8000-000000000032', 'Chocolate em Pó 50%', '18061000', 26.00, 26.00, 26.00,
   'kg', 'kg', 'pct', 1, 1.000, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('a0000000-0000-4000-8000-000000000033', 'Polpa de Maracujá Congelada', '20098990', 9.00, 9.00, 22.50,
   'kg', 'kg', 'un', 1, 0.400, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('a0000000-0000-4000-8000-000000000034', 'Morango', '08101000', 12.00, 12.00, 12.00,
   'kg', 'kg', 'pct', 1, 1.000, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('a0000000-0000-4000-8000-000000000035', 'Uva Itália', '08061000', 10.00, 10.00, 10.00,
   'kg', 'kg', 'pct', 1, 1.000, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('a0000000-0000-4000-8000-000000000036', 'Cenoura', '07061000', 6.00, 6.00, 6.00,
   'kg', 'kg', 'pct', 1, 1.000, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('a0000000-0000-4000-8000-000000000037', 'Fubá de Milho', '11022000', 6.00, 6.00, 6.00,
   'kg', 'kg', 'pct', 1, 1.000, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('a0000000-0000-4000-8000-000000000038', 'Corante Alimentício Vermelho (frasco 100ml)', '32041900', 15.00, 15.00, NULL,
   'un', 'un', 'un', 1, NULL, 0.100,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('a0000000-0000-4000-8000-000000000039', 'Mix de Frutas Vermelhas Congeladas', '08119000', 20.00, 20.00, 20.00,
   'kg', 'kg', 'pct', 1, 1.000, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('a0000000-0000-4000-8000-000000000040', 'Aveia em Flocos', '11040900', 9.00, 9.00, 9.00,
   'kg', 'kg', 'pct', 1, 1.000, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('a0000000-0000-4000-8000-000000000041', 'Mel', '04090000', 24.00, 24.00, 24.00,
   'kg', 'kg', 'un', 1, 1.000, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1))
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 3. NOVOS PRODUTOS DE PRODUÇÃO PRÓPRIA (type_product = OWN_PRODUCTION)
-- =========================================================================
-- cost_price = soma do custo dos itens de receita (ver seção 4)
-- unit_cost_price = cost_price / quantity ; price_per_kilogram = cost_price / weight
-- basis do lucro = price_per_kilogram se unit_of_measurement=kg, senão unit_cost_price

INSERT INTO product (
  id, name, ncm, cost_price, unit_cost_price, price_per_kilogram, sale_price, profit_price,
  unit_of_measurement, quantity, weight, expiration_date_in_days,
  type_product, stock_management, active, category, company, created_by, updated_by
)
VALUES
  ('b0000000-0000-4000-8000-000000000016', 'Pastel de Carne', '19059090', 44.74, 1.12, 13.98, 5.00, 3.88,
   'un', 40, 3.200, '1',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000005', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('b0000000-0000-4000-8000-000000000017', 'Pastel de Queijo', '19059090', 72.62, 1.82, 24.21, 5.50, 3.68,
   'un', 40, 3.000, '1',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000005', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('b0000000-0000-4000-8000-000000000018', 'Pastel de Frango com Catupiry', '19059090', 65.20, 1.63, 20.38, 5.80, 4.17,
   'un', 40, 3.200, '1',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000005', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('b0000000-0000-4000-8000-000000000019', 'Risole de Carne', '19059090', 40.30, 1.15, 15.50, 4.80, 3.65,
   'un', 35, 2.600, '2',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000005', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('b0000000-0000-4000-8000-000000000020', 'Folhado de Frango', '19059090', 49.00, 1.63, 20.42, 6.00, 4.37,
   'un', 30, 2.400, '2',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000005', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('b0000000-0000-4000-8000-000000000021', 'Folhado de Queijo', '19059090', 53.80, 1.79, 22.42, 6.00, 4.21,
   'un', 30, 2.400, '2',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000005', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('b0000000-0000-4000-8000-000000000022', 'Empanado de Frango', '19059090', 42.52, 0.85, 21.26, 3.50, 2.65,
   'un', 50, 2.000, '2',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000005', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('b0000000-0000-4000-8000-000000000023', 'Empada de Palmito', '19059090', 44.00, 1.26, 17.60, 5.50, 4.24,
   'un', 35, 2.500, '3',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000005', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('b0000000-0000-4000-8000-000000000024', 'Espetinho de Frango', '19059090', 37.80, 1.26, 17.18, 5.00, 3.74,
   'un', 30, 2.200, '1',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000005', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('b0000000-0000-4000-8000-000000000025', 'Espetinho de Carne', '19059090', 45.80, 1.53, 19.08, 6.50, 4.97,
   'un', 30, 2.400, '1',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000005', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('b0000000-0000-4000-8000-000000000026', 'Café com Leite', '19059090', 1.82, 1.82, 9.10, 4.00, 2.18,
   'un', 1, 0.200, '1',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000006', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('b0000000-0000-4000-8000-000000000027', 'Bolo de Nata', '19059090', 16.10, 16.10, 8.47, 32.00, 23.53,
   'kg', 1, 1.900, '5',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000003', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('b0000000-0000-4000-8000-000000000028', 'Bolo de Frutas Vermelhas', '19059090', 17.82, 17.82, 8.91, 34.00, 25.09,
   'kg', 1, 2.000, '4',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000003', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('b0000000-0000-4000-8000-000000000029', 'Bolo de Cenoura com Chocolate', '19059090', 15.42, 15.42, 8.12, 30.00, 21.88,
   'kg', 1, 1.900, '5',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000003', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('b0000000-0000-4000-8000-000000000030', 'Bolo de Fubá', '19059090', 18.52, 18.52, 9.75, 28.00, 18.25,
   'kg', 1, 1.900, '5',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000003', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('b0000000-0000-4000-8000-000000000031', 'Bolo Red Velvet', '19059090', 20.58, 20.58, 10.83, 38.00, 27.17,
   'kg', 1, 1.900, '4',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000003', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('b0000000-0000-4000-8000-000000000032', 'Mousse de Chocolate', '19059090', 33.46, 1.34, 13.38, 6.00, 4.66,
   'un', 25, 2.500, '5',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000003', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('b0000000-0000-4000-8000-000000000033', 'Mousse de Maracujá', '19059090', 37.36, 1.49, 14.94, 6.50, 5.01,
   'un', 25, 2.500, '5',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000003', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('b0000000-0000-4000-8000-000000000034', 'Mousse de Morango', '19059090', 27.76, 1.11, 11.10, 6.00, 4.89,
   'un', 25, 2.500, '5',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000003', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('b0000000-0000-4000-8000-000000000035', 'Bombom de Uva', '19059090', 23.00, 0.58, 23.00, 2.00, 1.42,
   'un', 40, 1.000, '3',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000003', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('b0000000-0000-4000-8000-000000000036', 'Bombom de Morango', '19059090', 25.20, 0.63, 22.91, 2.20, 1.57,
   'un', 40, 1.100, '3',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000003', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('b0000000-0000-4000-8000-000000000037', 'Torta de Maracujá', '19059090', 68.54, 68.54, 38.08, 48.00, 9.92,
   'kg', 1, 1.800, '4',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000003', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('b0000000-0000-4000-8000-000000000038', 'Sonho de Chocolate', '19059090', 49.42, 0.99, 13.01, 2.80, 1.81,
   'un', 50, 3.800, '2',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000003', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('b0000000-0000-4000-8000-000000000039', 'Sonho de Creme', '19059090', 29.52, 0.59, 8.20, 2.50, 1.91,
   'un', 50, 3.600, '2',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000003', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('b0000000-0000-4000-8000-000000000040', 'Cueca Virada', '19059090', 18.52, 0.46, 9.26, 2.00, 1.54,
   'un', 40, 2.000, '3',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000003', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('b0000000-0000-4000-8000-000000000041', 'Biscoito Caseiro de Chocolate', '19059090', 17.72, 17.72, 12.66, 26.00, 13.34,
   'kg', 1, 1.400, '15',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000003', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('b0000000-0000-4000-8000-000000000042', 'Biscoito Caseiro de Coco', '19059090', 18.22, 18.22, 13.01, 26.00, 12.99,
   'kg', 1, 1.400, '15',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000003', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('b0000000-0000-4000-8000-000000000043', 'Biscoito Caseiro de Aveia e Mel', '19059090', 19.32, 19.32, 13.80, 27.00, 13.20,
   'kg', 1, 1.400, '15',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000003', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1))
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 4. RECEITAS (recipe + recipe_item) e vínculo ao produto (product_recipe_link)
-- =========================================================================

INSERT INTO recipe (id, name, company, created_by, updated_by)
VALUES
  ('e0000000-0000-4000-8000-000000000016', 'Receita - Pastel de Carne', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000017', 'Receita - Pastel de Queijo', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000018', 'Receita - Pastel de Frango com Catupiry', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000019', 'Receita - Risole de Carne', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000020', 'Receita - Folhado de Frango', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000021', 'Receita - Folhado de Queijo', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000022', 'Receita - Empanado de Frango', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000023', 'Receita - Empada de Palmito', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000024', 'Receita - Espetinho de Frango', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000025', 'Receita - Espetinho de Carne', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000026', 'Receita - Café com Leite', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000027', 'Receita - Bolo de Nata', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000028', 'Receita - Bolo de Frutas Vermelhas', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000029', 'Receita - Bolo de Cenoura com Chocolate', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000030', 'Receita - Bolo de Fubá', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000031', 'Receita - Bolo Red Velvet', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000032', 'Receita - Mousse de Chocolate', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000033', 'Receita - Mousse de Maracujá', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000034', 'Receita - Mousse de Morango', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000035', 'Receita - Bombom de Uva', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000036', 'Receita - Bombom de Morango', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000037', 'Receita - Torta de Maracujá', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000038', 'Receita - Sonho de Chocolate', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000039', 'Receita - Sonho de Creme', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000040', 'Receita - Cueca Virada', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000041', 'Receita - Biscoito Caseiro de Chocolate', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000042', 'Receita - Biscoito Caseiro de Coco', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000043', 'Receita - Biscoito Caseiro de Aveia e Mel', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO recipe_item (id, recipe, material, quantity)
VALUES
  -- Receita - Pastel de Carne
  ('f0000000-0000-4000-8000-000000000087', 'e0000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000026', 2.500), -- Massa de Pastel (kg)
  ('f0000000-0000-4000-8000-000000000088', 'e0000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000025', 1.500), -- Carne Moída Temperada
  ('f0000000-0000-4000-8000-000000000089', 'e0000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000007', 0.800), -- Óleo de Soja (embalagem 1L)
  ('f0000000-0000-4000-8000-000000000090', 'e0000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000003', 0.030), -- Sal Refinado
  -- Receita - Pastel de Queijo
  ('f0000000-0000-4000-8000-000000000091', 'e0000000-0000-4000-8000-000000000017', 'a0000000-0000-4000-8000-000000000026', 2.500), -- Massa de Pastel (kg)
  ('f0000000-0000-4000-8000-000000000092', 'e0000000-0000-4000-8000-000000000017', 'a0000000-0000-4000-8000-000000000009', 1.800), -- Queijo Tipo Minas
  ('f0000000-0000-4000-8000-000000000093', 'e0000000-0000-4000-8000-000000000017', 'a0000000-0000-4000-8000-000000000007', 0.800), -- Óleo de Soja (embalagem 1L)
  ('f0000000-0000-4000-8000-000000000094', 'e0000000-0000-4000-8000-000000000017', 'a0000000-0000-4000-8000-000000000003', 0.020), -- Sal Refinado
  -- Receita - Pastel de Frango com Catupiry
  ('f0000000-0000-4000-8000-000000000095', 'e0000000-0000-4000-8000-000000000018', 'a0000000-0000-4000-8000-000000000026', 2.500), -- Massa de Pastel (kg)
  ('f0000000-0000-4000-8000-000000000096', 'e0000000-0000-4000-8000-000000000018', 'a0000000-0000-4000-8000-000000000020', 1.500), -- Frango Desfiado Temperado
  ('f0000000-0000-4000-8000-000000000097', 'e0000000-0000-4000-8000-000000000018', 'a0000000-0000-4000-8000-000000000027', 1.000), -- Catupiry (Requeijão Culinário)
  ('f0000000-0000-4000-8000-000000000098', 'e0000000-0000-4000-8000-000000000018', 'a0000000-0000-4000-8000-000000000007', 0.800), -- Óleo de Soja (embalagem 1L)
  -- Receita - Risole de Carne
  ('f0000000-0000-4000-8000-000000000099', 'e0000000-0000-4000-8000-000000000019', 'a0000000-0000-4000-8000-000000000026', 2.000), -- Massa de Pastel (kg)
  ('f0000000-0000-4000-8000-000000000100', 'e0000000-0000-4000-8000-000000000019', 'a0000000-0000-4000-8000-000000000025', 1.200), -- Carne Moída Temperada
  ('f0000000-0000-4000-8000-000000000101', 'e0000000-0000-4000-8000-000000000019', 'a0000000-0000-4000-8000-000000000021', 0.400), -- Farinha de Rosca
  ('f0000000-0000-4000-8000-000000000102', 'e0000000-0000-4000-8000-000000000019', 'a0000000-0000-4000-8000-000000000012', 3.000), -- Ovos
  ('f0000000-0000-4000-8000-000000000103', 'e0000000-0000-4000-8000-000000000019', 'a0000000-0000-4000-8000-000000000007', 0.600), -- Óleo de Soja (embalagem 1L)
  -- Receita - Folhado de Frango
  ('f0000000-0000-4000-8000-000000000104', 'e0000000-0000-4000-8000-000000000020', 'a0000000-0000-4000-8000-000000000028', 1.500), -- Massa Folhada Pronta
  ('f0000000-0000-4000-8000-000000000105', 'e0000000-0000-4000-8000-000000000020', 'a0000000-0000-4000-8000-000000000020', 1.200), -- Frango Desfiado Temperado
  ('f0000000-0000-4000-8000-000000000106', 'e0000000-0000-4000-8000-000000000020', 'a0000000-0000-4000-8000-000000000027', 0.500), -- Catupiry (Requeijão Culinário)
  ('f0000000-0000-4000-8000-000000000107', 'e0000000-0000-4000-8000-000000000020', 'a0000000-0000-4000-8000-000000000012', 2.000), -- Ovos
  -- Receita - Folhado de Queijo
  ('f0000000-0000-4000-8000-000000000108', 'e0000000-0000-4000-8000-000000000021', 'a0000000-0000-4000-8000-000000000028', 1.500), -- Massa Folhada Pronta
  ('f0000000-0000-4000-8000-000000000109', 'e0000000-0000-4000-8000-000000000021', 'a0000000-0000-4000-8000-000000000009', 1.000), -- Queijo Tipo Minas
  ('f0000000-0000-4000-8000-000000000110', 'e0000000-0000-4000-8000-000000000021', 'a0000000-0000-4000-8000-000000000027', 0.400), -- Catupiry (Requeijão Culinário)
  ('f0000000-0000-4000-8000-000000000111', 'e0000000-0000-4000-8000-000000000021', 'a0000000-0000-4000-8000-000000000012', 2.000), -- Ovos
  -- Receita - Empanado de Frango
  ('f0000000-0000-4000-8000-000000000112', 'e0000000-0000-4000-8000-000000000022', 'a0000000-0000-4000-8000-000000000020', 1.500), -- Frango Desfiado Temperado
  ('f0000000-0000-4000-8000-000000000113', 'e0000000-0000-4000-8000-000000000022', 'a0000000-0000-4000-8000-000000000021', 0.600), -- Farinha de Rosca
  ('f0000000-0000-4000-8000-000000000114', 'e0000000-0000-4000-8000-000000000022', 'a0000000-0000-4000-8000-000000000012', 4.000), -- Ovos
  ('f0000000-0000-4000-8000-000000000115', 'e0000000-0000-4000-8000-000000000022', 'a0000000-0000-4000-8000-000000000001', 0.300), -- Farinha de Trigo
  ('f0000000-0000-4000-8000-000000000116', 'e0000000-0000-4000-8000-000000000022', 'a0000000-0000-4000-8000-000000000007', 0.800), -- Óleo de Soja (embalagem 1L)
  -- Receita - Empada de Palmito
  ('f0000000-0000-4000-8000-000000000117', 'e0000000-0000-4000-8000-000000000023', 'a0000000-0000-4000-8000-000000000026', 1.500), -- Massa de Pastel (kg)
  ('f0000000-0000-4000-8000-000000000118', 'e0000000-0000-4000-8000-000000000023', 'a0000000-0000-4000-8000-000000000029', 1.000), -- Palmito em Conserva
  ('f0000000-0000-4000-8000-000000000119', 'e0000000-0000-4000-8000-000000000023', 'a0000000-0000-4000-8000-000000000012', 2.000), -- Ovos
  ('f0000000-0000-4000-8000-000000000120', 'e0000000-0000-4000-8000-000000000023', 'a0000000-0000-4000-8000-000000000005', 0.200), -- Manteiga sem Sal
  -- Receita - Espetinho de Frango
  ('f0000000-0000-4000-8000-000000000121', 'e0000000-0000-4000-8000-000000000024', 'a0000000-0000-4000-8000-000000000020', 2.000), -- Frango Desfiado Temperado
  ('f0000000-0000-4000-8000-000000000122', 'e0000000-0000-4000-8000-000000000024', 'a0000000-0000-4000-8000-000000000007', 0.200), -- Óleo de Soja (embalagem 1L)
  -- Receita - Espetinho de Carne
  ('f0000000-0000-4000-8000-000000000123', 'e0000000-0000-4000-8000-000000000025', 'a0000000-0000-4000-8000-000000000030', 2.200), -- Carne em Cubos Temperada (Espeto)
  ('f0000000-0000-4000-8000-000000000124', 'e0000000-0000-4000-8000-000000000025', 'a0000000-0000-4000-8000-000000000007', 0.200), -- Óleo de Soja (embalagem 1L)
  -- Receita - Café com Leite
  ('f0000000-0000-4000-8000-000000000125', 'e0000000-0000-4000-8000-000000000026', 'a0000000-0000-4000-8000-000000000031', 0.020), -- Café em Pó Torrado (Insumo)
  ('f0000000-0000-4000-8000-000000000126', 'e0000000-0000-4000-8000-000000000026', 'a0000000-0000-4000-8000-000000000006', 0.150), -- Leite Integral (embalagem 1L)
  ('f0000000-0000-4000-8000-000000000127', 'e0000000-0000-4000-8000-000000000026', 'a0000000-0000-4000-8000-000000000002', 0.010), -- Açúcar Refinado
  -- Receita - Bolo de Nata
  ('f0000000-0000-4000-8000-000000000128', 'e0000000-0000-4000-8000-000000000027', 'a0000000-0000-4000-8000-000000000001', 0.400), -- Farinha de Trigo
  ('f0000000-0000-4000-8000-000000000129', 'e0000000-0000-4000-8000-000000000027', 'a0000000-0000-4000-8000-000000000002', 0.400), -- Açúcar Refinado
  ('f0000000-0000-4000-8000-000000000130', 'e0000000-0000-4000-8000-000000000027', 'a0000000-0000-4000-8000-000000000012', 4.000), -- Ovos
  ('f0000000-0000-4000-8000-000000000131', 'e0000000-0000-4000-8000-000000000027', 'a0000000-0000-4000-8000-000000000005', 0.150), -- Manteiga sem Sal
  ('f0000000-0000-4000-8000-000000000132', 'e0000000-0000-4000-8000-000000000027', 'a0000000-0000-4000-8000-000000000006', 0.300), -- Leite Integral (embalagem 1L)
  ('f0000000-0000-4000-8000-000000000133', 'e0000000-0000-4000-8000-000000000027', 'a0000000-0000-4000-8000-000000000018', 0.200), -- Creme de Leite
  ('f0000000-0000-4000-8000-000000000134', 'e0000000-0000-4000-8000-000000000027', 'a0000000-0000-4000-8000-000000000023', 0.020), -- Fermento Químico em Pó
  -- Receita - Bolo de Frutas Vermelhas
  ('f0000000-0000-4000-8000-000000000135', 'e0000000-0000-4000-8000-000000000028', 'a0000000-0000-4000-8000-000000000001', 0.400), -- Farinha de Trigo
  ('f0000000-0000-4000-8000-000000000136', 'e0000000-0000-4000-8000-000000000028', 'a0000000-0000-4000-8000-000000000002', 0.350), -- Açúcar Refinado
  ('f0000000-0000-4000-8000-000000000137', 'e0000000-0000-4000-8000-000000000028', 'a0000000-0000-4000-8000-000000000012', 4.000), -- Ovos
  ('f0000000-0000-4000-8000-000000000138', 'e0000000-0000-4000-8000-000000000028', 'a0000000-0000-4000-8000-000000000005', 0.150), -- Manteiga sem Sal
  ('f0000000-0000-4000-8000-000000000139', 'e0000000-0000-4000-8000-000000000028', 'a0000000-0000-4000-8000-000000000006', 0.200), -- Leite Integral (embalagem 1L)
  ('f0000000-0000-4000-8000-000000000140', 'e0000000-0000-4000-8000-000000000028', 'a0000000-0000-4000-8000-000000000023', 0.020), -- Fermento Químico em Pó
  ('f0000000-0000-4000-8000-000000000141', 'e0000000-0000-4000-8000-000000000028', 'a0000000-0000-4000-8000-000000000039', 0.300), -- Mix de Frutas Vermelhas Congeladas
  -- Receita - Bolo de Cenoura com Chocolate
  ('f0000000-0000-4000-8000-000000000142', 'e0000000-0000-4000-8000-000000000029', 'a0000000-0000-4000-8000-000000000001', 0.400), -- Farinha de Trigo
  ('f0000000-0000-4000-8000-000000000143', 'e0000000-0000-4000-8000-000000000029', 'a0000000-0000-4000-8000-000000000002', 0.350), -- Açúcar Refinado
  ('f0000000-0000-4000-8000-000000000144', 'e0000000-0000-4000-8000-000000000029', 'a0000000-0000-4000-8000-000000000012', 4.000), -- Ovos
  ('f0000000-0000-4000-8000-000000000145', 'e0000000-0000-4000-8000-000000000029', 'a0000000-0000-4000-8000-000000000007', 0.300), -- Óleo de Soja (embalagem 1L)
  ('f0000000-0000-4000-8000-000000000146', 'e0000000-0000-4000-8000-000000000029', 'a0000000-0000-4000-8000-000000000036', 0.400), -- Cenoura
  ('f0000000-0000-4000-8000-000000000147', 'e0000000-0000-4000-8000-000000000029', 'a0000000-0000-4000-8000-000000000023', 0.020), -- Fermento Químico em Pó
  ('f0000000-0000-4000-8000-000000000148', 'e0000000-0000-4000-8000-000000000029', 'a0000000-0000-4000-8000-000000000032', 0.150), -- Chocolate em Pó 50%
  -- Receita - Bolo de Fubá
  ('f0000000-0000-4000-8000-000000000149', 'e0000000-0000-4000-8000-000000000030', 'a0000000-0000-4000-8000-000000000037', 0.500), -- Fubá de Milho
  ('f0000000-0000-4000-8000-000000000150', 'e0000000-0000-4000-8000-000000000030', 'a0000000-0000-4000-8000-000000000001', 0.150), -- Farinha de Trigo
  ('f0000000-0000-4000-8000-000000000151', 'e0000000-0000-4000-8000-000000000030', 'a0000000-0000-4000-8000-000000000002', 0.350), -- Açúcar Refinado
  ('f0000000-0000-4000-8000-000000000152', 'e0000000-0000-4000-8000-000000000030', 'a0000000-0000-4000-8000-000000000012', 4.000), -- Ovos
  ('f0000000-0000-4000-8000-000000000153', 'e0000000-0000-4000-8000-000000000030', 'a0000000-0000-4000-8000-000000000005', 0.100), -- Manteiga sem Sal
  ('f0000000-0000-4000-8000-000000000154', 'e0000000-0000-4000-8000-000000000030', 'a0000000-0000-4000-8000-000000000006', 0.300), -- Leite Integral (embalagem 1L)
  ('f0000000-0000-4000-8000-000000000155', 'e0000000-0000-4000-8000-000000000030', 'a0000000-0000-4000-8000-000000000023', 0.020), -- Fermento Químico em Pó
  ('f0000000-0000-4000-8000-000000000156', 'e0000000-0000-4000-8000-000000000030', 'a0000000-0000-4000-8000-000000000009', 0.200), -- Queijo Tipo Minas
  -- Receita - Bolo Red Velvet
  ('f0000000-0000-4000-8000-000000000157', 'e0000000-0000-4000-8000-000000000031', 'a0000000-0000-4000-8000-000000000001', 0.400), -- Farinha de Trigo
  ('f0000000-0000-4000-8000-000000000158', 'e0000000-0000-4000-8000-000000000031', 'a0000000-0000-4000-8000-000000000002', 0.400), -- Açúcar Refinado
  ('f0000000-0000-4000-8000-000000000159', 'e0000000-0000-4000-8000-000000000031', 'a0000000-0000-4000-8000-000000000012', 4.000), -- Ovos
  ('f0000000-0000-4000-8000-000000000160', 'e0000000-0000-4000-8000-000000000031', 'a0000000-0000-4000-8000-000000000007', 0.300), -- Óleo de Soja (embalagem 1L)
  ('f0000000-0000-4000-8000-000000000161', 'e0000000-0000-4000-8000-000000000031', 'a0000000-0000-4000-8000-000000000038', 0.020), -- Corante Alimentício Vermelho (frasco 100ml)
  ('f0000000-0000-4000-8000-000000000162', 'e0000000-0000-4000-8000-000000000031', 'a0000000-0000-4000-8000-000000000032', 0.080), -- Chocolate em Pó 50%
  ('f0000000-0000-4000-8000-000000000163', 'e0000000-0000-4000-8000-000000000031', 'a0000000-0000-4000-8000-000000000005', 0.150), -- Manteiga sem Sal
  ('f0000000-0000-4000-8000-000000000164', 'e0000000-0000-4000-8000-000000000031', 'a0000000-0000-4000-8000-000000000006', 0.200), -- Leite Integral (embalagem 1L)
  ('f0000000-0000-4000-8000-000000000165', 'e0000000-0000-4000-8000-000000000031', 'a0000000-0000-4000-8000-000000000023', 0.020), -- Fermento Químico em Pó
  ('f0000000-0000-4000-8000-000000000166', 'e0000000-0000-4000-8000-000000000031', 'a0000000-0000-4000-8000-000000000018', 0.200), -- Creme de Leite
  -- Receita - Mousse de Chocolate
  ('f0000000-0000-4000-8000-000000000167', 'e0000000-0000-4000-8000-000000000032', 'a0000000-0000-4000-8000-000000000008', 0.400), -- Chocolate em Barra (Cobertura)
  ('f0000000-0000-4000-8000-000000000168', 'e0000000-0000-4000-8000-000000000032', 'a0000000-0000-4000-8000-000000000018', 0.600), -- Creme de Leite
  ('f0000000-0000-4000-8000-000000000169', 'e0000000-0000-4000-8000-000000000032', 'a0000000-0000-4000-8000-000000000015', 0.500), -- Leite Condensado (lata 395g)
  ('f0000000-0000-4000-8000-000000000170', 'e0000000-0000-4000-8000-000000000032', 'a0000000-0000-4000-8000-000000000012', 3.000), -- Ovos
  -- Receita - Mousse de Maracujá
  ('f0000000-0000-4000-8000-000000000171', 'e0000000-0000-4000-8000-000000000033', 'a0000000-0000-4000-8000-000000000033', 0.800), -- Polpa de Maracujá Congelada
  ('f0000000-0000-4000-8000-000000000172', 'e0000000-0000-4000-8000-000000000033', 'a0000000-0000-4000-8000-000000000015', 0.500), -- Leite Condensado (lata 395g)
  ('f0000000-0000-4000-8000-000000000173', 'e0000000-0000-4000-8000-000000000033', 'a0000000-0000-4000-8000-000000000018', 0.600), -- Creme de Leite
  -- Receita - Mousse de Morango
  ('f0000000-0000-4000-8000-000000000174', 'e0000000-0000-4000-8000-000000000034', 'a0000000-0000-4000-8000-000000000034', 0.700), -- Morango
  ('f0000000-0000-4000-8000-000000000175', 'e0000000-0000-4000-8000-000000000034', 'a0000000-0000-4000-8000-000000000015', 0.500), -- Leite Condensado (lata 395g)
  ('f0000000-0000-4000-8000-000000000176', 'e0000000-0000-4000-8000-000000000034', 'a0000000-0000-4000-8000-000000000018', 0.600), -- Creme de Leite
  -- Receita - Bombom de Uva
  ('f0000000-0000-4000-8000-000000000177', 'e0000000-0000-4000-8000-000000000035', 'a0000000-0000-4000-8000-000000000035', 0.500), -- Uva Itália
  ('f0000000-0000-4000-8000-000000000178', 'e0000000-0000-4000-8000-000000000035', 'a0000000-0000-4000-8000-000000000008', 0.600), -- Chocolate em Barra (Cobertura)
  -- Receita - Bombom de Morango
  ('f0000000-0000-4000-8000-000000000179', 'e0000000-0000-4000-8000-000000000036', 'a0000000-0000-4000-8000-000000000034', 0.600), -- Morango
  ('f0000000-0000-4000-8000-000000000180', 'e0000000-0000-4000-8000-000000000036', 'a0000000-0000-4000-8000-000000000008', 0.600), -- Chocolate em Barra (Cobertura)
  -- Receita - Torta de Maracujá
  ('f0000000-0000-4000-8000-000000000181', 'e0000000-0000-4000-8000-000000000037', 'a0000000-0000-4000-8000-000000000017', 0.500), -- Biscoito Maisena Triturado
  ('f0000000-0000-4000-8000-000000000182', 'e0000000-0000-4000-8000-000000000037', 'a0000000-0000-4000-8000-000000000005', 0.200), -- Manteiga sem Sal
  ('f0000000-0000-4000-8000-000000000183', 'e0000000-0000-4000-8000-000000000037', 'a0000000-0000-4000-8000-000000000015', 2.000), -- Leite Condensado (lata 395g)
  ('f0000000-0000-4000-8000-000000000184', 'e0000000-0000-4000-8000-000000000037', 'a0000000-0000-4000-8000-000000000018', 0.400), -- Creme de Leite
  ('f0000000-0000-4000-8000-000000000185', 'e0000000-0000-4000-8000-000000000037', 'a0000000-0000-4000-8000-000000000033', 0.600), -- Polpa de Maracujá Congelada
  -- Receita - Sonho de Chocolate
  ('f0000000-0000-4000-8000-000000000186', 'e0000000-0000-4000-8000-000000000038', 'a0000000-0000-4000-8000-000000000001', 2.000), -- Farinha de Trigo
  ('f0000000-0000-4000-8000-000000000187', 'e0000000-0000-4000-8000-000000000038', 'a0000000-0000-4000-8000-000000000002', 0.300), -- Açúcar Refinado
  ('f0000000-0000-4000-8000-000000000188', 'e0000000-0000-4000-8000-000000000038', 'a0000000-0000-4000-8000-000000000004', 0.040), -- Fermento Biológico Seco
  ('f0000000-0000-4000-8000-000000000189', 'e0000000-0000-4000-8000-000000000038', 'a0000000-0000-4000-8000-000000000005', 0.150), -- Manteiga sem Sal
  ('f0000000-0000-4000-8000-000000000190', 'e0000000-0000-4000-8000-000000000038', 'a0000000-0000-4000-8000-000000000012', 4.000), -- Ovos
  ('f0000000-0000-4000-8000-000000000191', 'e0000000-0000-4000-8000-000000000038', 'a0000000-0000-4000-8000-000000000006', 0.300), -- Leite Integral (embalagem 1L)
  ('f0000000-0000-4000-8000-000000000192', 'e0000000-0000-4000-8000-000000000038', 'a0000000-0000-4000-8000-000000000007', 0.500), -- Óleo de Soja (embalagem 1L)
  ('f0000000-0000-4000-8000-000000000193', 'e0000000-0000-4000-8000-000000000038', 'a0000000-0000-4000-8000-000000000008', 0.800), -- Chocolate em Barra (Cobertura)
  -- Receita - Sonho de Creme
  ('f0000000-0000-4000-8000-000000000194', 'e0000000-0000-4000-8000-000000000039', 'a0000000-0000-4000-8000-000000000001', 2.000), -- Farinha de Trigo
  ('f0000000-0000-4000-8000-000000000195', 'e0000000-0000-4000-8000-000000000039', 'a0000000-0000-4000-8000-000000000002', 0.300), -- Açúcar Refinado
  ('f0000000-0000-4000-8000-000000000196', 'e0000000-0000-4000-8000-000000000039', 'a0000000-0000-4000-8000-000000000004', 0.040), -- Fermento Biológico Seco
  ('f0000000-0000-4000-8000-000000000197', 'e0000000-0000-4000-8000-000000000039', 'a0000000-0000-4000-8000-000000000005', 0.150), -- Manteiga sem Sal
  ('f0000000-0000-4000-8000-000000000198', 'e0000000-0000-4000-8000-000000000039', 'a0000000-0000-4000-8000-000000000012', 6.000), -- Ovos
  ('f0000000-0000-4000-8000-000000000199', 'e0000000-0000-4000-8000-000000000039', 'a0000000-0000-4000-8000-000000000006', 0.600), -- Leite Integral (embalagem 1L)
  ('f0000000-0000-4000-8000-000000000200', 'e0000000-0000-4000-8000-000000000039', 'a0000000-0000-4000-8000-000000000007', 0.500), -- Óleo de Soja (embalagem 1L)
  ('f0000000-0000-4000-8000-000000000201', 'e0000000-0000-4000-8000-000000000039', 'a0000000-0000-4000-8000-000000000024', 0.100), -- Açúcar de Confeiteiro
  -- Receita - Cueca Virada
  ('f0000000-0000-4000-8000-000000000202', 'e0000000-0000-4000-8000-000000000040', 'a0000000-0000-4000-8000-000000000001', 1.500), -- Farinha de Trigo
  ('f0000000-0000-4000-8000-000000000203', 'e0000000-0000-4000-8000-000000000040', 'a0000000-0000-4000-8000-000000000002', 0.200), -- Açúcar Refinado
  ('f0000000-0000-4000-8000-000000000204', 'e0000000-0000-4000-8000-000000000040', 'a0000000-0000-4000-8000-000000000012', 3.000), -- Ovos
  ('f0000000-0000-4000-8000-000000000205', 'e0000000-0000-4000-8000-000000000040', 'a0000000-0000-4000-8000-000000000005', 0.100), -- Manteiga sem Sal
  ('f0000000-0000-4000-8000-000000000206', 'e0000000-0000-4000-8000-000000000040', 'a0000000-0000-4000-8000-000000000007', 0.600), -- Óleo de Soja (embalagem 1L)
  ('f0000000-0000-4000-8000-000000000207', 'e0000000-0000-4000-8000-000000000040', 'a0000000-0000-4000-8000-000000000024', 0.100), -- Açúcar de Confeiteiro
  -- Receita - Biscoito Caseiro de Chocolate
  ('f0000000-0000-4000-8000-000000000208', 'e0000000-0000-4000-8000-000000000041', 'a0000000-0000-4000-8000-000000000001', 0.600), -- Farinha de Trigo
  ('f0000000-0000-4000-8000-000000000209', 'e0000000-0000-4000-8000-000000000041', 'a0000000-0000-4000-8000-000000000002', 0.300), -- Açúcar Refinado
  ('f0000000-0000-4000-8000-000000000210', 'e0000000-0000-4000-8000-000000000041', 'a0000000-0000-4000-8000-000000000005', 0.300), -- Manteiga sem Sal
  ('f0000000-0000-4000-8000-000000000211', 'e0000000-0000-4000-8000-000000000041', 'a0000000-0000-4000-8000-000000000012', 2.000), -- Ovos
  ('f0000000-0000-4000-8000-000000000212', 'e0000000-0000-4000-8000-000000000041', 'a0000000-0000-4000-8000-000000000032', 0.150), -- Chocolate em Pó 50%
  ('f0000000-0000-4000-8000-000000000213', 'e0000000-0000-4000-8000-000000000041', 'a0000000-0000-4000-8000-000000000023', 0.010), -- Fermento Químico em Pó
  -- Receita - Biscoito Caseiro de Coco
  ('f0000000-0000-4000-8000-000000000214', 'e0000000-0000-4000-8000-000000000042', 'a0000000-0000-4000-8000-000000000001', 0.600), -- Farinha de Trigo
  ('f0000000-0000-4000-8000-000000000215', 'e0000000-0000-4000-8000-000000000042', 'a0000000-0000-4000-8000-000000000002', 0.300), -- Açúcar Refinado
  ('f0000000-0000-4000-8000-000000000216', 'e0000000-0000-4000-8000-000000000042', 'a0000000-0000-4000-8000-000000000005', 0.300), -- Manteiga sem Sal
  ('f0000000-0000-4000-8000-000000000217', 'e0000000-0000-4000-8000-000000000042', 'a0000000-0000-4000-8000-000000000012', 2.000), -- Ovos
  ('f0000000-0000-4000-8000-000000000218', 'e0000000-0000-4000-8000-000000000042', 'a0000000-0000-4000-8000-000000000014', 0.200), -- Coco Ralado
  ('f0000000-0000-4000-8000-000000000219', 'e0000000-0000-4000-8000-000000000042', 'a0000000-0000-4000-8000-000000000023', 0.010), -- Fermento Químico em Pó
  -- Receita - Biscoito Caseiro de Aveia e Mel
  ('f0000000-0000-4000-8000-000000000220', 'e0000000-0000-4000-8000-000000000043', 'a0000000-0000-4000-8000-000000000040', 0.500), -- Aveia em Flocos
  ('f0000000-0000-4000-8000-000000000221', 'e0000000-0000-4000-8000-000000000043', 'a0000000-0000-4000-8000-000000000001', 0.300), -- Farinha de Trigo
  ('f0000000-0000-4000-8000-000000000222', 'e0000000-0000-4000-8000-000000000043', 'a0000000-0000-4000-8000-000000000005', 0.250), -- Manteiga sem Sal
  ('f0000000-0000-4000-8000-000000000223', 'e0000000-0000-4000-8000-000000000043', 'a0000000-0000-4000-8000-000000000041', 0.200), -- Mel
  ('f0000000-0000-4000-8000-000000000224', 'e0000000-0000-4000-8000-000000000043', 'a0000000-0000-4000-8000-000000000012', 2.000), -- Ovos
  ('f0000000-0000-4000-8000-000000000225', 'e0000000-0000-4000-8000-000000000043', 'a0000000-0000-4000-8000-000000000023', 0.010) -- Fermento Químico em Pó
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_recipe_link (product, recipe)
VALUES
  ('b0000000-0000-4000-8000-000000000016', 'e0000000-0000-4000-8000-000000000016'),
  ('b0000000-0000-4000-8000-000000000017', 'e0000000-0000-4000-8000-000000000017'),
  ('b0000000-0000-4000-8000-000000000018', 'e0000000-0000-4000-8000-000000000018'),
  ('b0000000-0000-4000-8000-000000000019', 'e0000000-0000-4000-8000-000000000019'),
  ('b0000000-0000-4000-8000-000000000020', 'e0000000-0000-4000-8000-000000000020'),
  ('b0000000-0000-4000-8000-000000000021', 'e0000000-0000-4000-8000-000000000021'),
  ('b0000000-0000-4000-8000-000000000022', 'e0000000-0000-4000-8000-000000000022'),
  ('b0000000-0000-4000-8000-000000000023', 'e0000000-0000-4000-8000-000000000023'),
  ('b0000000-0000-4000-8000-000000000024', 'e0000000-0000-4000-8000-000000000024'),
  ('b0000000-0000-4000-8000-000000000025', 'e0000000-0000-4000-8000-000000000025'),
  ('b0000000-0000-4000-8000-000000000026', 'e0000000-0000-4000-8000-000000000026'),
  ('b0000000-0000-4000-8000-000000000027', 'e0000000-0000-4000-8000-000000000027'),
  ('b0000000-0000-4000-8000-000000000028', 'e0000000-0000-4000-8000-000000000028'),
  ('b0000000-0000-4000-8000-000000000029', 'e0000000-0000-4000-8000-000000000029'),
  ('b0000000-0000-4000-8000-000000000030', 'e0000000-0000-4000-8000-000000000030'),
  ('b0000000-0000-4000-8000-000000000031', 'e0000000-0000-4000-8000-000000000031'),
  ('b0000000-0000-4000-8000-000000000032', 'e0000000-0000-4000-8000-000000000032'),
  ('b0000000-0000-4000-8000-000000000033', 'e0000000-0000-4000-8000-000000000033'),
  ('b0000000-0000-4000-8000-000000000034', 'e0000000-0000-4000-8000-000000000034'),
  ('b0000000-0000-4000-8000-000000000035', 'e0000000-0000-4000-8000-000000000035'),
  ('b0000000-0000-4000-8000-000000000036', 'e0000000-0000-4000-8000-000000000036'),
  ('b0000000-0000-4000-8000-000000000037', 'e0000000-0000-4000-8000-000000000037'),
  ('b0000000-0000-4000-8000-000000000038', 'e0000000-0000-4000-8000-000000000038'),
  ('b0000000-0000-4000-8000-000000000039', 'e0000000-0000-4000-8000-000000000039'),
  ('b0000000-0000-4000-8000-000000000040', 'e0000000-0000-4000-8000-000000000040'),
  ('b0000000-0000-4000-8000-000000000041', 'e0000000-0000-4000-8000-000000000041'),
  ('b0000000-0000-4000-8000-000000000042', 'e0000000-0000-4000-8000-000000000042'),
  ('b0000000-0000-4000-8000-000000000043', 'e0000000-0000-4000-8000-000000000043')
ON CONFLICT (product, recipe) DO NOTHING;

-- =========================================================================
-- 5. NOVOS PRODUTOS DE REVENDA (type_product = RESALE)
-- =========================================================================
-- unit_cost_price = cost_price / quantity ; price_per_kilogram sempre NULL (todos vendidos por 'un')

INSERT INTO product (
  id, name, ncm, bar_code, cost_price, unit_cost_price, price_per_kilogram, sale_price, profit_price,
  unit_of_measurement, quantity, weight, expiration_date_in_days,
  type_product, stock_management, active, category, company, created_by, updated_by
)
VALUES
  ('d0000000-0000-4000-8000-000000000008', 'Trident Menta', '17041000', '7891000000100',
   21.60, 1.80, NULL, 3.00, 1.20,
   'un', 12, NULL, '365',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000007', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('d0000000-0000-4000-8000-000000000009', 'Trident Hortelã', '17041000', '7891000000101',
   21.60, 1.80, NULL, 3.00, 1.20,
   'un', 12, NULL, '365',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000007', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('d0000000-0000-4000-8000-000000000010', 'Trident Tutti-Frutti', '17041000', '7891000000102',
   21.60, 1.80, NULL, 3.00, 1.20,
   'un', 12, NULL, '365',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000007', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('d0000000-0000-4000-8000-000000000011', 'Trident Melancia', '17041000', '7891000000103',
   21.60, 1.80, NULL, 3.00, 1.20,
   'un', 12, NULL, '365',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000007', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('d0000000-0000-4000-8000-000000000012', 'Trident Morango', '17041000', '7891000000104',
   21.60, 1.80, NULL, 3.00, 1.20,
   'un', 12, NULL, '365',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000007', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('d0000000-0000-4000-8000-000000000013', 'Halls Mentho-Lyptus', '17049090', '7891000000105',
   18.00, 1.50, NULL, 2.50, 1.00,
   'un', 12, NULL, '365',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000007', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('d0000000-0000-4000-8000-000000000014', 'Halls Extra Forte', '17049090', '7891000000106',
   18.00, 1.50, NULL, 2.50, 1.00,
   'un', 12, NULL, '365',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000007', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('d0000000-0000-4000-8000-000000000015', 'Halls Cereja', '17049090', '7891000000107',
   18.00, 1.50, NULL, 2.50, 1.00,
   'un', 12, NULL, '365',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000007', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('d0000000-0000-4000-8000-000000000016', 'Halls Menta Verde', '17049090', '7891000000108',
   18.00, 1.50, NULL, 2.50, 1.00,
   'un', 12, NULL, '365',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000007', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('d0000000-0000-4000-8000-000000000017', 'Halls Abacaxi', '17049090', '7891000000109',
   18.00, 1.50, NULL, 2.50, 1.00,
   'un', 12, NULL, '365',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000007', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('d0000000-0000-4000-8000-000000000018', 'Coca-Cola Lata 350ml', '22021000', '7891000000110',
   30.00, 2.50, NULL, 5.00, 2.50,
   'un', 12, NULL, '180',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000006', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('d0000000-0000-4000-8000-000000000019', 'Guaraná Antarctica Lata 350ml', '22021000', '7891000000111',
   30.00, 2.50, NULL, 5.00, 2.50,
   'un', 12, NULL, '180',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000006', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('d0000000-0000-4000-8000-000000000020', 'Fanta Laranja Lata 350ml', '22021000', '7891000000112',
   30.00, 2.50, NULL, 5.00, 2.50,
   'un', 12, NULL, '180',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000006', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('d0000000-0000-4000-8000-000000000021', 'Fanta Uva Lata 350ml', '22021000', '7891000000113',
   30.00, 2.50, NULL, 5.00, 2.50,
   'un', 12, NULL, '180',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000006', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('d0000000-0000-4000-8000-000000000022', 'Sprite Lata 350ml', '22021000', '7891000000114',
   30.00, 2.50, NULL, 5.00, 2.50,
   'un', 12, NULL, '180',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000006', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('d0000000-0000-4000-8000-000000000023', 'Pepsi Lata 350ml', '22021000', '7891000000115',
   30.00, 2.50, NULL, 5.00, 2.50,
   'un', 12, NULL, '180',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000006', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('d0000000-0000-4000-8000-000000000024', 'Suco Del Valle Uva 290ml', '20098900', '7891000000116',
   45.00, 3.00, NULL, 5.50, 2.50,
   'un', 15, NULL, '180',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000006', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('d0000000-0000-4000-8000-000000000025', 'Suco Del Valle Laranja 290ml', '20098900', '7891000000117',
   45.00, 3.00, NULL, 5.50, 2.50,
   'un', 15, NULL, '180',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000006', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('d0000000-0000-4000-8000-000000000026', 'Suco Maguary Caixinha Manga 200ml', '20098900', '7891000000118',
   45.00, 3.00, NULL, 5.50, 2.50,
   'un', 15, NULL, '180',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000006', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('d0000000-0000-4000-8000-000000000027', 'Suco Maguary Caixinha Uva 200ml', '20098900', '7891000000119',
   45.00, 3.00, NULL, 5.50, 2.50,
   'un', 15, NULL, '180',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000006', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('d0000000-0000-4000-8000-000000000028', 'Suco Natural One Laranja 300ml', '20098900', '7891000000120',
   45.00, 3.00, NULL, 5.50, 2.50,
   'un', 15, NULL, '180',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000006', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('d0000000-0000-4000-8000-000000000029', 'Achocolatado Toddynho 200ml', '18069000', '7891000000121',
   33.00, 2.20, NULL, 4.50, 2.30,
   'un', 15, NULL, '120',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000006', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('d0000000-0000-4000-8000-000000000030', 'Achocolatado Nescau Pronto 200ml', '18069000', '7891000000122',
   33.00, 2.20, NULL, 4.50, 2.30,
   'un', 15, NULL, '120',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000006', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('d0000000-0000-4000-8000-000000000031', 'Achocolatado Itambé 200ml', '18069000', '7891000000123',
   33.00, 2.20, NULL, 4.50, 2.30,
   'un', 15, NULL, '120',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000006', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('d0000000-0000-4000-8000-000000000032', 'Achocolatado Piracanjuba 200ml', '18069000', '7891000000124',
   33.00, 2.20, NULL, 4.50, 2.30,
   'un', 15, NULL, '120',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000006', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1))
ON CONFLICT (id) DO NOTHING;

-- Conferir com:
--   SELECT count(*) FROM product WHERE type_product = 'RAW_MATERIAL' AND company = '2d8dac1b-082b-42a7-b296-7c19f6be5024'; -- esperado: 41
--   SELECT count(*) FROM product WHERE type_product = 'OWN_PRODUCTION' AND company = '2d8dac1b-082b-42a7-b296-7c19f6be5024'; -- esperado: 43
--   SELECT count(*) FROM product WHERE type_product = 'RESALE' AND company = '2d8dac1b-082b-42a7-b296-7c19f6be5024'; -- esperado: 32
--   SELECT count(*) FROM recipe;              -- esperado: 43
--   SELECT count(*) FROM recipe_item;         -- esperado: 225
--   SELECT count(*) FROM product_recipe_link; -- esperado: 43

