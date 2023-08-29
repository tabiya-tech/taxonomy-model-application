import Ajv, {ErrorObject} from "ajv";
import * as Locale from 'api-specifications/locale';
import * as ModelInfo from "api-specifications/modelInfo";
import addFormats from "ajv-formats";
import * as Import from "api-specifications/import";

export const ajvInstance = new Ajv({validateSchema: true, allErrors: true, strict: true});
addFormats(ajvInstance);
ajvInstance.addSchema(Locale.Schema.GET.Response, Locale.Schema.GET.Response.$id);
ajvInstance.addSchema(ModelInfo.Schema.POST.Request, ModelInfo.Schema.POST.Request.$id);
ajvInstance.addSchema(ModelInfo.Schema.POST.Response, ModelInfo.Schema.POST.Response.$id);
ajvInstance.addSchema(Import.Schema.POST.Request, Import.Schema.POST.Request.$id);
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