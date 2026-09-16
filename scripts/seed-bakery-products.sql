-- Seed de exemplo: categorias, matérias-primas, receitas (produção própria)
-- e produtos de revenda para uma padaria.
--
-- Empresa alvo: company.id = '2d8dac1b-082b-42a7-b296-7c19f6be5024'
--
-- Script avulso (não é uma migration TypeORM) — roda manualmente contra o
-- Postgres do bakers-api. Idempotente via ON CONFLICT (id) DO NOTHING: pode
-- ser executado mais de uma vez sem erro de chave duplicada.
--
-- Todos os valores derivados (unit_cost_price, price_per_kilogram, cost_price
-- de receita, profit_price) foram calculados manualmente seguindo as mesmas
-- fórmulas de ProductUnitCostCalculator / ProductRecipeCostCalculator /
-- ProductProfitCalculator usadas pelo CreateProductUseCase.
--
-- IMPORTANTE: o bakers-api roda com um schema Postgres dedicado (variável
-- DB_SCHEMA no .env, ex.: no Supabase costuma ser 'bakers_bill', não
-- 'public'). Ajuste o valor abaixo para o DB_SCHEMA do seu ambiente antes de
-- rodar — sem isso, os INSERTs vão falhar com "relation ... does not exist"
-- porque vão procurar as tabelas no schema 'public' errado.

SET search_path TO bakers_bill;

-- =========================================================================
-- 1. CATEGORIAS
-- =========================================================================

INSERT INTO category (id, name, company, created_by, updated_by)
VALUES
  ('c0000000-0000-4000-8000-000000000001', 'Matéria-Prima', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('c0000000-0000-4000-8000-000000000002', 'Pães', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('c0000000-0000-4000-8000-000000000003', 'Confeitaria', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('c0000000-0000-4000-8000-000000000004', 'Revenda', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1))
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 2. MATÉRIAS-PRIMAS (type_product = RAW_MATERIAL, categoria "Matéria-Prima")
-- =========================================================================
-- unit_cost_price = cost_price / quantity
-- price_per_kilogram = unit_cost_price / weight (consumer_unit=kg) ou / volume (ml); NULL se consumer_unit=un

INSERT INTO product (
  id, name, ncm, cost_price, unit_cost_price, price_per_kilogram,
  unit_of_measurement, consumer_unit, purchase_unit, quantity, weight, volume,
  type_product, stock_management, active, category, company, created_by, updated_by
)
VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Farinha de Trigo', '11010010', 220.00, 220.00, 4.40,
   'kg', 'kg', 'sc', 1, 50.000, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('a0000000-0000-4000-8000-000000000002', 'Açúcar Refinado', '17019900', 180.00, 180.00, 3.60,
   'kg', 'kg', 'sc', 1, 50.000, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('a0000000-0000-4000-8000-000000000003', 'Sal Refinado', '25010020', 30.00, 30.00, 1.20,
   'kg', 'kg', 'sc', 1, 25.000, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('a0000000-0000-4000-8000-000000000004', 'Fermento Biológico Seco', '21021010', 28.00, 28.00, 56.00,
   'kg', 'kg', 'pct', 1, 0.500, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('a0000000-0000-4000-8000-000000000005', 'Manteiga sem Sal', '04051000', 280.00, 280.00, 28.00,
   'kg', 'kg', 'cx', 1, 10.000, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('a0000000-0000-4000-8000-000000000006', 'Leite Integral (embalagem 1L)', '04012000', 6.00, 6.00, NULL,
   'un', 'un', 'un', 1, NULL, 1.000,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('a0000000-0000-4000-8000-000000000007', 'Óleo de Soja (embalagem 1L)', '15079011', 9.00, 9.00, NULL,
   'un', 'un', 'un', 1, NULL, 1.000,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('a0000000-0000-4000-8000-000000000008', 'Chocolate em Barra (Cobertura)', '18063900', 60.00, 60.00, 30.00,
   'kg', 'kg', 'cx', 1, 2.000, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('a0000000-0000-4000-8000-000000000009', 'Queijo Tipo Minas', '04061000', 140.00, 140.00, 28.00,
   'kg', 'kg', 'cx', 1, 5.000, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('a0000000-0000-4000-8000-000000000010', 'Polvilho Doce', '11081900', 12.00, 12.00, 12.00,
   'kg', 'kg', 'pct', 1, 1.000, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('a0000000-0000-4000-8000-000000000011', 'Polvilho Azedo', '11081900', 14.00, 14.00, 14.00,
   'kg', 'kg', 'pct', 1, 1.000, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('a0000000-0000-4000-8000-000000000012', 'Ovos', '04072100', 21.00, 0.70, NULL,
   'un', 'un', 'cx', 30, NULL, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('a0000000-0000-4000-8000-000000000013', 'Doce de Leite (Recheio)', '19011000', 85.00, 85.00, 17.00,
   'kg', 'kg', 'pct', 1, 5.000, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('a0000000-0000-4000-8000-000000000014', 'Coco Ralado', '08011900', 22.00, 22.00, 22.00,
   'kg', 'kg', 'pct', 1, 1.000, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('a0000000-0000-4000-8000-000000000015', 'Leite Condensado (lata 395g)', '19011000', 7.00, 7.00, 17.72,
   'kg', 'kg', 'un', 1, 0.395, NULL,
   'RAW_MATERIAL', false, true, 'c0000000-0000-4000-8000-000000000001', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1))
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 3. RECEITAS / PRODUÇÃO PRÓPRIA (type_product = OWN_PRODUCTION)
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
  ('b0000000-0000-4000-8000-000000000001', 'Pão Francês', '19059090', 31.16, 0.31, 4.79, 0.75, 0.44,
   'un', 100, 6.500, '1',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000002', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('b0000000-0000-4000-8000-000000000002', 'Pão de Queijo', '19059090', 103.96, 0.52, 17.33, 1.20, 0.68,
   'un', 200, 6.000, '3',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000002', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('b0000000-0000-4000-8000-000000000003', 'Bolo de Chocolate', '19059090', 22.60, 22.60, 10.27, 35.00, 24.73,
   'kg', 1, 2.200, '5',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000003', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('b0000000-0000-4000-8000-000000000004', 'Sonho', '19059090', 42.42, 0.85, 12.12, 2.50, 1.65,
   'un', 50, 3.500, '2',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000003', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('b0000000-0000-4000-8000-000000000005', 'Beijinho', '17049010', 25.16, 0.42, 13.98, 1.00, 0.58,
   'un', 60, 1.800, '3',
   'OWN_PRODUCTION', false, true, 'c0000000-0000-4000-8000-000000000003', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1))
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 4. RECEITAS (recipe + recipe_item) e vínculo ao produto (product_recipe_link)
-- =========================================================================
-- Mecanismo correto de receita reutilizável do projeto: uma linha em `recipe`
-- por produto, seus insumos em `recipe_item` (receita -> matéria-prima +
-- quantidade), e o produto final ligado à receita via `product_recipe_link`.
-- (Não usar product_recipe_item aqui — esse é o vínculo de matéria-prima
-- avulsa direto no produto, mecanismo diferente do de receita.)

INSERT INTO recipe (id, name, company, created_by, updated_by)
VALUES
  ('e0000000-0000-4000-8000-000000000001', 'Receita - Pão Francês', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000002', 'Receita - Pão de Queijo', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000003', 'Receita - Bolo de Chocolate', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000004', 'Receita - Sonho', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),
  ('e0000000-0000-4000-8000-000000000005', 'Receita - Beijinho', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO recipe_item (id, recipe, material, quantity)
VALUES
  -- Receita - Pão Francês
  ('f0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 6.000), -- Farinha de Trigo
  ('f0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', 0.120), -- Sal Refinado
  ('f0000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004', 0.060), -- Fermento Biológico Seco
  ('f0000000-0000-4000-8000-000000000004', 'e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 0.100), -- Açúcar Refinado
  ('f0000000-0000-4000-8000-000000000005', 'e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000007', 0.100), -- Óleo de Soja (fração da embalagem 1L)

  -- Receita - Pão de Queijo
  ('f0000000-0000-4000-8000-000000000006', 'e0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000010', 2.000), -- Polvilho Doce
  ('f0000000-0000-4000-8000-000000000007', 'e0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000011', 2.000), -- Polvilho Azedo
  ('f0000000-0000-4000-8000-000000000008', 'e0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000009', 1.500), -- Queijo Tipo Minas
  ('f0000000-0000-4000-8000-000000000009', 'e0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000012', 6.000), -- Ovos (6 unidades)
  ('f0000000-0000-4000-8000-000000000010', 'e0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000007', 0.300), -- Óleo de Soja (fração)
  ('f0000000-0000-4000-8000-000000000011', 'e0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000006', 0.500), -- Leite Integral (fração)
  ('f0000000-0000-4000-8000-000000000012', 'e0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003', 0.050), -- Sal Refinado

  -- Receita - Bolo de Chocolate
  ('f0000000-0000-4000-8000-000000000013', 'e0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 0.500), -- Farinha de Trigo
  ('f0000000-0000-4000-8000-000000000014', 'e0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002', 0.500), -- Açúcar Refinado
  ('f0000000-0000-4000-8000-000000000015', 'e0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000008', 0.300), -- Chocolate em Barra
  ('f0000000-0000-4000-8000-000000000016', 'e0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000012', 4.000), -- Ovos (4 unidades)
  ('f0000000-0000-4000-8000-000000000017', 'e0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000005', 0.200), -- Manteiga sem Sal
  ('f0000000-0000-4000-8000-000000000018', 'e0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000006', 0.200), -- Leite Integral (fração)

  -- Receita - Sonho
  ('f0000000-0000-4000-8000-000000000019', 'e0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 2.000), -- Farinha de Trigo
  ('f0000000-0000-4000-8000-000000000020', 'e0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002', 0.300), -- Açúcar Refinado
  ('f0000000-0000-4000-8000-000000000021', 'e0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000004', 0.040), -- Fermento Biológico Seco
  ('f0000000-0000-4000-8000-000000000022', 'e0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000005', 0.150), -- Manteiga sem Sal
  ('f0000000-0000-4000-8000-000000000023', 'e0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000012', 4.000), -- Ovos (4 unidades)
  ('f0000000-0000-4000-8000-000000000024', 'e0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000006', 0.300), -- Leite Integral (fração)
  ('f0000000-0000-4000-8000-000000000025', 'e0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000013', 1.000), -- Doce de Leite
  ('f0000000-0000-4000-8000-000000000026', 'e0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000007', 0.500), -- Óleo de Soja (fração)

  -- Receita - Beijinho
  ('f0000000-0000-4000-8000-000000000027', 'e0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000015', 1.000), -- Leite Condensado
  ('f0000000-0000-4000-8000-000000000028', 'e0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000014', 0.300), -- Coco Ralado
  ('f0000000-0000-4000-8000-000000000029', 'e0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000005', 0.030) -- Manteiga sem Sal
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_recipe_link (product, recipe)
VALUES
  ('b0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000002'),
  ('b0000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000003'),
  ('b0000000-0000-4000-8000-000000000004', 'e0000000-0000-4000-8000-000000000004'),
  ('b0000000-0000-4000-8000-000000000005', 'e0000000-0000-4000-8000-000000000005')
ON CONFLICT (product, recipe) DO NOTHING;

-- =========================================================================
-- 5. PRODUTOS DE REVENDA (type_product = RESALE, categoria "Revenda")
-- =========================================================================
-- unit_cost_price = cost_price / quantity
-- price_per_kilogram = unit_cost_price / weight, só quando unit_of_measurement = 'kg'

INSERT INTO product (
  id, name, ncm, bar_code, cost_price, unit_cost_price, price_per_kilogram, sale_price, profit_price,
  unit_of_measurement, quantity, weight, expiration_date_in_days,
  type_product, stock_management, active, category, company, created_by, updated_by
)
VALUES
  ('d0000000-0000-4000-8000-000000000001', 'Refrigerante Lata 350ml', '22021000', '7891000000011',
   30.00, 2.50, NULL, 5.00, 2.50,
   'un', 12, NULL, '180',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000004', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('d0000000-0000-4000-8000-000000000002', 'Suco de Caixinha 200ml', '20098900', '7891000000028',
   48.00, 2.00, NULL, 4.00, 2.00,
   'un', 24, NULL, '180',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000004', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('d0000000-0000-4000-8000-000000000003', 'Água Mineral 500ml', '22011000', '7891000000035',
   18.00, 1.50, NULL, 3.00, 1.50,
   'un', 12, NULL, '365',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000004', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('d0000000-0000-4000-8000-000000000004', 'Salgadinho Industrializado', '19059090', '7891000000042',
   60.00, 3.00, NULL, 6.00, 3.00,
   'un', 20, NULL, '120',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000004', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('d0000000-0000-4000-8000-000000000005', 'Barra de Cereal', '19042000', '7891000000059',
   36.00, 1.50, NULL, 3.50, 2.00,
   'un', 24, NULL, '270',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000004', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('d0000000-0000-4000-8000-000000000006', 'Chocolate Barra Industrializado', '18063200', '7891000000066',
   70.00, 3.50, NULL, 7.00, 3.50,
   'un', 20, NULL, '270',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000004', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1)),

  ('d0000000-0000-4000-8000-000000000007', 'Café em Pó Torrado (kg)', '09012100', '7891000000073',
   100.00, 10.00, 20.00, 32.00, 12.00,
   'kg', 10, 0.500, '365',
   'RESALE', false, true, 'c0000000-0000-4000-8000-000000000004', '2d8dac1b-082b-42a7-b296-7c19f6be5024',
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1),
   (SELECT id FROM "user" WHERE company = '2d8dac1b-082b-42a7-b296-7c19f6be5024' ORDER BY created_at LIMIT 1))
ON CONFLICT (id) DO NOTHING;
