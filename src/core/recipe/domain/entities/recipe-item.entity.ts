import { Data } from '@/shared/domain/decorators/data.decorator';
import { BaseEntity } from '@/shared/domain/entity/base-entity';
import { Product } from '@/core/product/domain/entities/product.entity';
import { EntityValidationError } from '@/shared/application/errors/validation-error';
import { Recipe } from './recipe.entity';
import { RecipeItemValidatorFactory } from '../validators/recipe-item-validator';

// Item de uma receita-base reutilizável (matéria-prima + quantidade). Não
// confundir com ProductRecipeItem, que é a matéria-prima avulsa vinculada
// direto a um produto de produção própria, fora de qualquer receita.
export type RecipeItemProps = {
  recipe: Recipe;
  material: Product;
  quantity: number;
};

export type CreateRecipeItemProps = {
  recipe: Recipe;
  material: Product;
  quantity: number;
};

export interface RecipeItem extends RecipeItemProps {}

@Data()
export class RecipeItem extends BaseEntity<RecipeItemProps> {
  protected validate(): void {
    const validator = RecipeItemValidatorFactory.create();

    const isValid = validator.validate(this.props);
    if (!isValid) {
      throw new EntityValidationError(validator.errors);
    }
  }

  static create(props: CreateRecipeItemProps): RecipeItem {
    return new RecipeItem({
      id: crypto.randomUUID(),
      recipe: props.recipe,
      material: props.material,
      quantity: props.quantity,
    });
  }

  updateQuantity(quantity: number): void {
    this.quantity = quantity;
  }
}
