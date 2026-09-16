-- Segunda leva de seed: mais matérias-primas (só as que faltavam), mais
-- categorias e 10 novos produtos de produção própria com suas receitas.
-- Complementa o seed-bakery-products.sql (reaproveita as matérias-primas e
-- categorias já criadas por ele; roda depois dele).
--
-- Empresa alvo: company.id = '2d8dac1b-082b-42a7-b296-7c19f6be5024'
--
-- Script avulso (não é uma migration TypeORM). Idempotente via
-- ON CONFLICT (id) DO NOTHING: pode ser executado mais de uma vez sem erro
-- de chave duplicada.
--
-- Todos os valores derivados (unit_cost_price, price_per_kilogram, cost_price
-- de receita, profit_price) foram calculados manualmente seguindo as mesmas
-- fórmulas de ProductUnitCostCalculator / ProductRecipeCostCalculator /
-- ProductProfitCalculator usadas pelo CreateProductUseCase.
--
-- IMPORTANTE: ajuste o schema abaixo (DB_SCHEMA do .env) se for diferente de
-- 'bakers_bill' no seu ambiente.

SET search_path TO bakers_bill;

-- =========================================================================
-- 1. NOVA CATEGORIA (Salgados — para coxinha/empada, que não existiam antes)
-- =========================================================================

INSERT INTO category (id, name, company, created_by, updated_by)
VALUES
  ('c0000000-0000-4000-8000-000000000005', 'Salgados', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1))
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 2. NOVAS MATÉRIAS-PRIMAS (só as que ainda não existiam no primeiro seed)
-- =========================================================================
-- Mesma fórmula do seed anterior: unit_cost_price = cost_price / quantity;
-- price_per_kilogram = unit_cost_price / weight (consumer_unit=kg); NULL se un.

INSERT INTO product (
  id, name, ncm, cost_price, unit_cost_price, price_per_kilogram,
  unit_of_measurement, consumer_unit, purchase_unit, quantity, weight, volume,
  type_product, stock_management, active, category, company, created_by, updated_by
)
VALUES
  ('a0000000-0000-4000-8000-000000000016', 'Canela em Pó', '09061900', 8.00, 8.00, 80.00,
   'kg', 'kg', 'pct', 1, 0.100, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('a0000000-0000-4000-8000-000000000017', 'Biscoito Maisena Triturado', '19053100', 14.00, 14.00, 14.00,
   'kg', 'kg', 'pct', 1, 1.000, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('a0000000-0000-4000-8000-000000000018', 'Creme de Leite', '04039000', 3.50, 3.50, 17.50,
   'kg', 'kg', 'un', 1, 0.200, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('a0000000-0000-4000-8000-000000000019', 'Limão Tahiti', '08055000', 14.00, 0.70, NULL,
   'un', 'un', 'sc', 20, NULL, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('a0000000-0000-4000-8000-000000000020', 'Frango Desfiado Temperado', '16023200', 36.00, 36.00, 18.00,
   'kg', 'kg', 'pct', 1, 2.000, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('a0000000-0000-4000-8000-000000000021', 'Farinha de Rosca', '19022000', 7.00, 7.00, 7.00,
   'kg', 'kg', 'pct', 1, 1.000, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('a0000000-0000-4000-8000-000000000022', 'Requeijão Cremoso', '04061090', 9.00, 9.00, 22.50,
   'kg', 'kg', 'un', 1, 0.400, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('a0000000-0000-4000-8000-000000000023', 'Fermento Químico em Pó', '21023000', 6.00, 6.00, 30.00,
   'kg', 'kg', 'pct', 1, 0.200, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('a0000000-0000-4000-8000-000000000024', 'Açúcar de Confeiteiro', '17019900', 9.00, 9.00, 9.00,
   'kg', 'kg', 'pct', 1, 1.000, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1))
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 3. NOVAS RECEITAS / PRODUÇÃO PRÓPRIA (type_product = OWN_PRODUCTION)
-- =========================================================================
-- Mesma fórmula do seed anterior: cost_price = soma dos itens de receita;
-- unit_cost_price = cost_price/quantity; price_per_kilogram = cost_price/weight;
-- profit_price = sale_price - basis (basis = price_per_kilogram se kg, senão unit_cost_price).

INSERT INTO product (
  id, name, ncm, cost_price, unit_cost_price, price_per_kilogram, sale_price, profit_price,
  unit_of_measurement, quantity, weight, expiration_date_in_days,
  type_product, stock_management, active, category, company, created_by, updated_by
)
VALUES
  ('b0000000-0000-4000-8000-000000000006', 'Pão de Forma', '19059090', 36.02, 4.50, 9.01, 9.90, 5.40,
   'un', 8, 4.000, '5',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000002', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('b0000000-0000-4000-8000-000000000007', 'Croissant', '19059090', 61.85, 1.55, 19.33, 4.50, 2.95,
   'un', 40, 3.200, '3',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000002', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('b0000000-0000-4000-8000-000000000008', 'Rosca de Canela', '19059090', 30.32, 30.32, 13.78, 28.00, 14.22,
   'kg', 1, 2.200, '5',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000003', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('b0000000-0000-4000-8000-000000000009', 'Cocada', '17049010', 41.28, 1.03, 18.76, 2.00, 0.97,
   'un', 40, 2.200, '7',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000003', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('b0000000-0000-4000-8000-000000000010', 'Brigadeiro Gourmet', '17049010', 30.84, 0.51, 17.13, 1.20, 0.69,
   'un', 60, 1.800, '7',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000003', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('b0000000-0000-4000-8000-000000000011', 'Palha Italiana', '19059090', 41.12, 41.12, 20.56, 38.00, 17.44,
   'kg', 1, 2.000, '7',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000003', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('b0000000-0000-4000-8000-000000000012', 'Coxinha de Frango', '19059090', 45.10, 0.90, 11.28, 6.50, 5.60,
   'un', 50, 4.000, '2',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000005', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('b0000000-0000-4000-8000-000000000013', 'Empada de Frango', '19059090', 35.88, 0.90, 11.21, 6.00, 5.10,
   'un', 40, 3.200, '3',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000005', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('b0000000-0000-4000-8000-000000000014', 'Torta de Limão', '19059090', 59.24, 59.24, 32.91, 45.00, 12.09,
   'kg', 1, 1.800, '4',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000003', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('b0000000-0000-4000-8000-000000000015', 'Rosquinha Doce', '19059090', 12.96, 0.43, 8.64, 2.20, 1.77,
   'un', 30, 1.500, '4',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000003', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1))
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 4. RECEITAS (recipe + recipe_item) e vínculo ao produto (product_recipe_link)
-- =========================================================================
-- Mesmo mecanismo do primeiro seed: recipe -> recipe_item (insumo+qtd) ->
-- product_recipe_link (liga o produto final à receita). Não usar
-- product_recipe_item aqui (é o vínculo de matéria-prima avulsa, outro
-- mecanismo).

INSERT INTO recipe (id, name, company, created_by, updated_by)
VALUES
  ('e0000000-0000-4000-8000-000000000006', 'Receita - Pão de Forma', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000007', 'Receita - Croissant', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000008', 'Receita - Rosca de Canela', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000009', 'Receita - Cocada', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000010', 'Receita - Brigadeiro Gourmet', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000011', 'Receita - Palha Italiana', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000012', 'Receita - Coxinha de Frango', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000013', 'Receita - Empada de Frango', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000014', 'Receita - Torta de Limão', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000015', 'Receita - Rosquinha Doce', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO recipe_item (id, recipe, material, quantity)
VALUES
  -- Receita - Pão de Forma
  ('f0000000-0000-4000-8000-000000000030', 'e0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001', 5.000), -- Farinha de Trigo
  ('f0000000-0000-4000-8000-000000000031', 'e0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000002', 0.200), -- Açúcar Refinado
  ('f0000000-0000-4000-8000-000000000032', 'e0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000003', 0.080), -- Sal Refinado
  ('f0000000-0000-4000-8000-000000000033', 'e0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000004', 0.050), -- Fermento Biológico Seco
  ('f0000000-0000-4000-8000-000000000034', 'e0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000005', 0.150), -- Manteiga sem Sal
  ('f0000000-0000-4000-8000-000000000035', 'e0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000006', 0.800), -- Leite Integral (fração)
  ('f0000000-0000-4000-8000-000000000036', 'e0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000012', 2.000), -- Ovos

  -- Receita - Croissant
  ('f0000000-0000-4000-8000-000000000037', 'e0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000001', 3.000), -- Farinha de Trigo
  ('f0000000-0000-4000-8000-000000000038', 'e0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000005', 1.500), -- Manteiga sem Sal
  ('f0000000-0000-4000-8000-000000000039', 'e0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000002', 0.150), -- Açúcar Refinado
  ('f0000000-0000-4000-8000-000000000040', 'e0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000003', 0.060), -- Sal Refinado
  ('f0000000-0000-4000-8000-000000000041', 'e0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000004', 0.040), -- Fermento Biológico Seco
  ('f0000000-0000-4000-8000-000000000042', 'e0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000006', 0.400), -- Leite Integral (fração)
  ('f0000000-0000-4000-8000-000000000043', 'e0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000012', 2.000), -- Ovos

  -- Receita - Rosca de Canela
  ('f0000000-0000-4000-8000-000000000044', 'e0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000001', 2.000), -- Farinha de Trigo
  ('f0000000-0000-4000-8000-000000000045', 'e0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000002', 0.400), -- Açúcar Refinado
  ('f0000000-0000-4000-8000-000000000046', 'e0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000005', 0.300), -- Manteiga sem Sal
  ('f0000000-0000-4000-8000-000000000047', 'e0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000012', 3.000), -- Ovos
  ('f0000000-0000-4000-8000-000000000048', 'e0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000006', 0.500), -- Leite Integral (fração)
  ('f0000000-0000-4000-8000-000000000049', 'e0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000004', 0.030), -- Fermento Biológico Seco
  ('f0000000-0000-4000-8000-000000000050', 'e0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000016', 0.050), -- Canela em Pó
  ('f0000000-0000-4000-8000-000000000051', 'e0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000024', 0.100), -- Açúcar de Confeiteiro (cobertura)

  -- Receita - Cocada
  ('f0000000-0000-4000-8000-000000000052', 'e0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000014', 1.000), -- Coco Ralado
  ('f0000000-0000-4000-8000-000000000053', 'e0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000015', 1.000), -- Leite Condensado
  ('f0000000-0000-4000-8000-000000000054', 'e0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000002', 0.200), -- Açúcar Refinado
  ('f0000000-0000-4000-8000-000000000055', 'e0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000005', 0.030), -- Manteiga sem Sal

  -- Receita - Brigadeiro Gourmet
  ('f0000000-0000-4000-8000-000000000056', 'e0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000015', 1.000), -- Leite Condensado
  ('f0000000-0000-4000-8000-000000000057', 'e0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000008', 0.400), -- Chocolate em Barra
  ('f0000000-0000-4000-8000-000000000058', 'e0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000005', 0.040), -- Manteiga sem Sal

  -- Receita - Palha Italiana
  ('f0000000-0000-4000-8000-000000000059', 'e0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000008', 0.500), -- Chocolate em Barra
  ('f0000000-0000-4000-8000-000000000060', 'e0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000015', 1.000), -- Leite Condensado
  ('f0000000-0000-4000-8000-000000000061', 'e0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000005', 0.100), -- Manteiga sem Sal
  ('f0000000-0000-4000-8000-000000000062', 'e0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000017', 0.400), -- Biscoito Maisena Triturado

  -- Receita - Coxinha de Frango
  ('f0000000-0000-4000-8000-000000000063', 'e0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000001', 1.500), -- Farinha de Trigo
  ('f0000000-0000-4000-8000-000000000064', 'e0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000020', 1.200), -- Frango Desfiado Temperado
  ('f0000000-0000-4000-8000-000000000065', 'e0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000022', 0.200), -- Requeijão Cremoso
  ('f0000000-0000-4000-8000-000000000066', 'e0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000021', 0.300), -- Farinha de Rosca
  ('f0000000-0000-4000-8000-000000000067', 'e0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000012', 3.000), -- Ovos
  ('f0000000-0000-4000-8000-000000000068', 'e0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000007', 0.600), -- Óleo de Soja (fração, fritura)
  ('f0000000-0000-4000-8000-000000000069', 'e0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000005', 0.100), -- Manteiga sem Sal

  -- Receita - Empada de Frango
  ('f0000000-0000-4000-8000-000000000070', 'e0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000001', 1.200), -- Farinha de Trigo
  ('f0000000-0000-4000-8000-000000000071', 'e0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000005', 0.400), -- Manteiga sem Sal
  ('f0000000-0000-4000-8000-000000000072', 'e0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000020', 0.800), -- Frango Desfiado Temperado
  ('f0000000-0000-4000-8000-000000000073', 'e0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000012', 2.000), -- Ovos
  ('f0000000-0000-4000-8000-000000000074', 'e0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000022', 0.160), -- Requeijão Cremoso

  -- Receita - Torta de Limão
  ('f0000000-0000-4000-8000-000000000075', 'e0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000017', 0.500), -- Biscoito Maisena Triturado
  ('f0000000-0000-4000-8000-000000000076', 'e0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000005', 0.200), -- Manteiga sem Sal
  ('f0000000-0000-4000-8000-000000000077', 'e0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000015', 2.000), -- Leite Condensado
  ('f0000000-0000-4000-8000-000000000078', 'e0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000018', 0.400), -- Creme de Leite
  ('f0000000-0000-4000-8000-000000000079', 'e0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000019', 6.000), -- Limão Tahiti (6 unidades)

  -- Receita - Rosquinha Doce
  ('f0000000-0000-4000-8000-000000000080', 'e0000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000001', 1.000), -- Farinha de Trigo
  ('f0000000-0000-4000-8000-000000000081', 'e0000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000002', 0.150), -- Açúcar Refinado
  ('f0000000-0000-4000-8000-000000000082', 'e0000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000012', 3.000), -- Ovos
  ('f0000000-0000-4000-8000-000000000083', 'e0000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000005', 0.100), -- Manteiga sem Sal
  ('f0000000-0000-4000-8000-000000000084', 'e0000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000023', 0.020), -- Fermento Químico em Pó
  ('f0000000-0000-4000-8000-000000000085', 'e0000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000006', 0.300), -- Leite Integral (fração)
  ('f0000000-0000-4000-8000-000000000086', 'e0000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000024', 0.080) -- Açúcar de Confeiteiro (cobertura)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_recipe_link (product, recipe)
VALUES
  ('b0000000-0000-4000-8000-000000000006', 'e0000000-0000-4000-8000-000000000006'),
  ('b0000000-0000-4000-8000-000000000007', 'e0000000-0000-4000-8000-000000000007'),
  ('b0000000-0000-4000-8000-000000000008', 'e0000000-0000-4000-8000-000000000008'),
  ('b0000000-0000-4000-8000-000000000009', 'e0000000-0000-4000-8000-000000000009'),
  ('b0000000-0000-4000-8000-000000000010', 'e0000000-0000-4000-8000-000000000010'),
  ('b0000000-0000-4000-8000-000000000011', 'e0000000-0000-4000-8000-000000000011'),
  ('b0000000-0000-4000-8000-000000000012', 'e0000000-0000-4000-8000-000000000012'),
  ('b0000000-0000-4000-8000-000000000013', 'e0000000-0000-4000-8000-000000000013'),
  ('b0000000-0000-4000-8000-000000000014', 'e0000000-0000-4000-8000-000000000014'),
  ('b0000000-0000-4000-8000-000000000015', 'e0000000-0000-4000-8000-000000000015')
ON CONFLICT (product, recipe) DO NOTHING;

-- Conferir com:
--   SELECT count(*) FROM product WHERE type_product = 'RAW_MATERIAL' AND company = '2d8dac1b-082b-42a7-b296-7c19f6be5024'; -- esperado: 24
--   SELECT count(*) FROM product WHERE type_product = 'OWN_PRODUCTION' AND company = '2d8dac1b-082b-42a7-b296-7c19f6be5024'; -- esperado: 15
--   SELECT count(*) FROM recipe;              -- esperado: 15 (5 leva 1 + 10 leva 2)
--   SELECT count(*) FROM recipe_item;         -- esperado: 86 (29 leva 1 + 57 leva 2)
--   SELECT count(*) FROM product_recipe_link; -- esperado: 15
