import Ajv, { ErrorObject } from "ajv";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import addFormats from "ajv-formats";
import LocaleAPISpecs from "api-specifications/locale";
import ImportAPISpecs from "api-specifications/import";
import ExportAPISpecs from "api-specifications/export";
import AuthAPISpecs from "api-specifications/auth";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import OccupationAPISpecs from "api-specifications/esco/occupation";
import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";
import SkillAPISpecs from "api-specifications/esco/skill";

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
ajvInstance.addSchema(
  OccupationAPISpecs.Schemas.POST.Request.Payload,
  OccupationAPISpecs.Schemas.POST.Request.Payload.$id
);
ajvInstance.addSchema(
  OccupationAPISpecs.Schemas.GET.Response.Payload,
  OccupationAPISpecs.Schemas.GET.Response.Payload.$id
);
ajvInstance.addSchema(
  OccupationAPISpecs.Schemas.GET.Request.Param.Payload,
  OccupationAPISpecs.Schemas.GET.Request.Param.Payload.$id
);
ajvInstance.addSchema(
  OccupationAPISpecs.Schemas.GET.Request.Query.Payload,
  OccupationAPISpecs.Schemas.GET.Request.Query.Payload.$id
);
ajvInstance.addSchema(
  OccupationAPISpecs.Schemas.GET.Request.ById.Param.Payload,
  OccupationAPISpecs.Schemas.GET.Request.ById.Param.Payload.$id
);
ajvInstance.addSchema(
  SkillGroupAPISpecs.Schemas.POST.Request.Payload,
  SkillGroupAPISpecs.Schemas.POST.Request.Payload.$id
);
ajvInstance.addSchema(
  SkillGroupAPISpecs.Schemas.POST.Request.Param.Payload,
  SkillGroupAPISpecs.Schemas.POST.Request.Param.Payload.$id
);
ajvInstance.addSchema(
  SkillGroupAPISpecs.Schemas.GET.Request.Param.Payload,
  SkillGroupAPISpecs.Schemas.GET.Request.Param.Payload.$id
);
ajvInstance.addSchema(
  SkillGroupAPISpecs.Schemas.GET.Request.Query.Payload,
  SkillGroupAPISpecs.Schemas.GET.Request.Query.Payload.$id
);
ajvInstance.addSchema(
  SkillGroupAPISpecs.Schemas.GET.Request.ById.Param.Payload,
  SkillGroupAPISpecs.Schemas.GET.Request.ById.Param.Payload.$id
);
ajvInstance.addSchema(
  SkillGroupAPISpecs.Schemas.GET.Response.Payload,
  SkillGroupAPISpecs.Schemas.GET.Response.Payload.$id
);
ajvInstance.addSchema(
  SkillGroupAPISpecs.Schemas.GET.Response.ById.Payload,
  SkillGroupAPISpecs.Schemas.GET.Response.ById.Payload.$id
);
ajvInstance.addSchema(
  SkillAPISpecs.Schemas.GET.Request.Param.Payload,
  SkillAPISpecs.Schemas.GET.Request.Param.Payload.$id
);
ajvInstance.addSchema(
  SkillAPISpecs.Schemas.GET.Request.Query.Payload,
  SkillAPISpecs.Schemas.GET.Request.Query.Payload.$id
);
ajvInstance.addSchema(
  SkillAPISpecs.Schemas.GET.Request.ById.Param.Payload,
  SkillAPISpecs.Schemas.GET.Request.ById.Param.Payload.$id
);
ajvInstance.addSchema(
  SkillAPISpecs.Schemas.GET.Response.ById.Payload,
  SkillAPISpecs.Schemas.GET.Response.ById.Payload.$id
);
ajvInstance.addSchema(SkillAPISpecs.Schemas.POST.Request.Payload, SkillAPISpecs.Schemas.POST.Request.Payload.$id);
ajvInstance.addSchema(
  SkillAPISpecs.Schemas.POST.Request.Param.Payload,
  SkillAPISpecs.Schemas.POST.Request.Param.Payload.$id
);
ajvInstance.addSchema(SkillAPISpecs.Schemas.GET.Response.Payload, SkillAPISpecs.Schemas.GET.Response.Payload.$id);

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
