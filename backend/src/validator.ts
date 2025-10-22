import Ajv, { ErrorObject } from "ajv";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import addFormats from "ajv-formats";
import LocaleAPISpecs from "api-specifications/locale";
import ImportAPISpecs from "api-specifications/import";
import ExportAPISpecs from "api-specifications/export";
import AuthAPISpecs from "api-specifications/auth";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";

export const ajvInstance = new Ajv({
  validateSchema: true,
  allErrors: true,
  strict: true,
});
addFormats(ajvInstance);
ajvInstance.addSchema(LocaleAPISpecs.Schemas.Payload, LocaleAPISpecs.Schemas.Payload.$id);
ajvInstance.addSchema(
  ModelInfoAPISpecs.Schemas.POST.Request.Payload,
  ModelInfoAPISpecs.Schemas.POST.Request.Payload.$id
);
ajvInstance.addSchema(
  ModelInfoAPISpecs.Schemas.POST.Response.Payload,
  ModelInfoAPISpecs.Schemas.POST.Response.Payload.$id
);
ajvInstance.addSchema(ImportAPISpecs.Schemas.POST.Request.Payload, ImportAPISpecs.Schemas.POST.Request.Payload.$id);
ajvInstance.addSchema(ExportAPISpecs.Schemas.POST.Request.Payload, ExportAPISpecs.Schemas.POST.Request.Payload.$id);
ajvInstance.addSchema(AuthAPISpecs.Schemas.Request.Context, AuthAPISpecs.Schemas.Request.Context.$id);
ajvInstance.addSchema(
  OccupationGroupAPISpecs.Schemas.POST.Request.Payload,
  OccupationGroupAPISpecs.Schemas.POST.Request.Payload.$id
);
ajvInstance.addSchema(
  OccupationGroupAPISpecs.Schemas.GET.Response.Payload,
  OccupationGroupAPISpecs.Schemas.GET.Response.Payload.$id
);
ajvInstance.addSchema(
  OccupationGroupAPISpecs.Schemas.GET.Request.Param.Payload,
  OccupationGroupAPISpecs.Schemas.GET.Request.Param.Payload.$id
);
ajvInstance.addSchema(
  OccupationGroupAPISpecs.Schemas.GET.Request.Query.Payload,
  OccupationGroupAPISpecs.Schemas.GET.Request.Query.Payload.$id
);
ajvInstance.addSchema(
  OccupationGroupAPISpecs.Schemas.GET.Request.ById.Param.Payload,
  OccupationGroupAPISpecs.Schemas.GET.Request.ById.Param.Payload.$id
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
