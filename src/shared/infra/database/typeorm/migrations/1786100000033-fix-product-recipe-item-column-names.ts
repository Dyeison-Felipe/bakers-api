import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixProductRecipeItemColumnNames1786100000033
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'product_recipe_item' AND column_name = 'material_id'
        ) THEN
          ALTER TABLE product_recipe_item RENAME COLUMN material_id TO material;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'product_recipe_item' AND column_name = 'product_id'
        ) THEN
          ALTER TABLE product_recipe_item RENAME COLUMN product_id TO product;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'product_recipe_item' AND column_name = 'material'
        ) THEN
          ALTER TABLE product_recipe_item RENAME COLUMN material TO material_id;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'product_recipe_item' AND column_name = 'product'
        ) THEN
          ALTER TABLE product_recipe_item RENAME COLUMN product TO product_id;
        END IF;
      END $$;
    `);
  }
}
