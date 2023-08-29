import Ajv, {ErrorObject} from "ajv";
import Locale from 'api-specifications/locale';
import ModelInfo from "api-specifications/modelInfo";
import addFormats from "ajv-formats";
import Import from "api-specifications/import";

export const ajvInstance = new Ajv({validateSchema: true, allErrors: true, strict: true});
addFormats(ajvInstance);
ajvInstance.addSchema(Locale.Schema, Locale.Schema.$id);
ajvInstance.addSchema(ModelInfo.POST.Request.Schema, ModelInfo.POST.Request.Schema.$id);
ajvInstance.addSchema(ModelInfo.POST.Response.Schema, ModelInfo.POST.Response.Schema.$id);
ajvInstance.addSchema(Import.POST.Request.Schema, Import.POST.Request.Schema.$id);
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