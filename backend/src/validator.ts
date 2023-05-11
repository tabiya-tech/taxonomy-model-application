import Ajv, {ErrorObject} from "ajv";
import {ModelInfoResponseSchema, ModelInfoRequestSchema, LocaleSchema} from 'api-specifications/modelInfo';
import addFormats from "ajv-formats";

export const ajvInstance = new Ajv({validateSchema: true, allErrors: true, strict: true});
addFormats(ajvInstance);
ajvInstance.addSchema(LocaleSchema, LocaleSchema.$id);
ajvInstance.addSchema(ModelInfoRequestSchema, ModelInfoRequestSchema.$id);
ajvInstance.addSchema(ModelInfoResponseSchema, ModelInfoResponseSchema.$id);

/**
 * Turn the errors from ajv and turn into a string that consumers can read.
 * @param errors
 * @constructor
 */
export function ParseValidationError(errors: ErrorObject[] | null | undefined) {
  return ajvInstance.errorsText(
    errors?.filter((err) => err.keyword !== "if"),
    { dataVar: "[schema validation] " }
  );
}