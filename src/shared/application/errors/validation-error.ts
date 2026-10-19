import { FieldsError } from "../validators/validator-field.interface";
import { firstErrorMessage } from "@/shared/domain/validators/validation-messages";

export class ValidationError extends Error {}

export class EntityValidationError extends Error {
  constructor(public error: FieldsError) {
    // A primeira mensagem vira o `message` da resposta, para o frontend
    // conseguir exibir algo legível mesmo sem ler o mapa `errors`.
    super(firstErrorMessage(error));
    this.name = 'EntityValidationError';
  }
}
