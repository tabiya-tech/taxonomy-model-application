import Ajv, { ErrorObject } from "ajv";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import addFormats from "ajv-formats";
import LocaleAPISpecs from "api-specifications/locale";
import ImportAPISpecs from "api-specifications/import";

export const ajvInstance = new Ajv({
  validateSchema: true,
  allErrors: true,
  strict: true,
});
addFormats(ajvInstance);
ajvInstance.addSchema(
  LocaleAPISpecs.Schemas.Payload,
  LocaleAPISpecs.Schemas.Payload.$id
);
ajvInstance.addSchema(
  ModelInfoAPISpecs.Schemas.POST.Request.Payload,
  ModelInfoAPISpecs.Schemas.POST.Request.Payload.$id
);
ajvInstance.addSchema(
  ModelInfoAPISpecs.Schemas.POST.Response.Payload,
  ModelInfoAPISpecs.Schemas.POST.Response.Payload.$id
);
ajvInstance.addSchema(
  ImportAPISpecs.Schemas.POST.Request.Payload,
  ImportAPISpecs.Schemas.POST.Request.Payload.$id
);
/**
 * Turn the errors from ajv and turn into a string that consumers can read.
 * @param errors
 * @constructor
 */
export function ParseValidationError(errors: ErrorObject[] | null | undefined) {
  return ajvInstance.errorsText(errors?.filter((err) => err.keyword !== "if"), {
    dataVar: "[schema validation] ",
  });
}
