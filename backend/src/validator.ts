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
  OccupationGroupAPISpecs.POST.Schemas.Request.Payload,
  OccupationGroupAPISpecs.POST.Schemas.Request.Payload.$id
);
ajvInstance.addSchema(
  OccupationGroupAPISpecs.POST.Schemas.Response.Payload,
  OccupationGroupAPISpecs.POST.Schemas.Response.Payload.$id
);
ajvInstance.addSchema(
  OccupationGroupAPISpecs.GET.Schemas.Request.Param.Payload,
  OccupationGroupAPISpecs.GET.Schemas.Request.Param.Payload.$id
);
ajvInstance.addSchema(
  OccupationGroupAPISpecs.GET.Schemas.Request.Query.Payload,
  OccupationGroupAPISpecs.GET.Schemas.Request.Query.Payload.$id
);
ajvInstance.addSchema(
  OccupationGroupAPISpecs.GET.Schemas.Response.Payload,
  OccupationGroupAPISpecs.GET.Schemas.Response.Payload.$id
);

ajvInstance.addSchema(
  OccupationGroupAPISpecs.OccupationGroup.Schemas.Request.Param.Payload,
  OccupationGroupAPISpecs.OccupationGroup.Schemas.Request.Param.Payload.$id
);
ajvInstance.addSchema(
  OccupationGroupAPISpecs.OccupationGroup.GET.Schemas.Response.Payload,
  OccupationGroupAPISpecs.OccupationGroup.GET.Schemas.Response.Payload.$id
);
ajvInstance.addSchema(
  OccupationGroupAPISpecs.OccupationGroup.Parent.GET.Schemas.Response.Payload,
  OccupationGroupAPISpecs.OccupationGroup.Parent.GET.Schemas.Response.Payload.$id
);
ajvInstance.addSchema(
  OccupationGroupAPISpecs.OccupationGroup.Children.GET.Schemas.Response.Child.Payload,
  OccupationGroupAPISpecs.OccupationGroup.Children.GET.Schemas.Response.Child.Payload.$id
);
ajvInstance.addSchema(
  OccupationGroupAPISpecs.OccupationGroup.Children.GET.Schemas.Response.Children.Payload,
  OccupationGroupAPISpecs.OccupationGroup.Children.GET.Schemas.Response.Children.Payload.$id
);
ajvInstance.addSchema(
  OccupationAPISpecs.POST.Schemas.Request.Payload,
  OccupationAPISpecs.POST.Schemas.Request.Payload.$id
);
ajvInstance.addSchema(
  OccupationAPISpecs.GET.Schemas.Response.Payload,
  OccupationAPISpecs.GET.Schemas.Response.Payload.$id
);
ajvInstance.addSchema(
  OccupationAPISpecs.GET.Schemas.Request.Param.Payload,
  OccupationAPISpecs.GET.Schemas.Request.Param.Payload.$id
);
ajvInstance.addSchema(
  OccupationAPISpecs.GET.Schemas.Request.Query.Payload,
  OccupationAPISpecs.GET.Schemas.Request.Query.Payload.$id
);
ajvInstance.addSchema(
  OccupationAPISpecs.Occupation.GET.Schemas.Request.Param.Payload,
  OccupationAPISpecs.Occupation.GET.Schemas.Request.Param.Payload.$id
);
ajvInstance.addSchema(
  OccupationAPISpecs.Occupation.Parent.GET.Schemas.Response.Payload,
  OccupationAPISpecs.Occupation.Parent.GET.Schemas.Response.Payload.$id
);
ajvInstance.addSchema(
  OccupationAPISpecs.Occupation.Children.GET.Schemas.Response.Payload,
  OccupationAPISpecs.Occupation.Children.GET.Schemas.Response.Payload.$id
);
ajvInstance.addSchema(
  OccupationAPISpecs.Occupation.Children.GET.Schemas.Request.Query.Payload,
  OccupationAPISpecs.Occupation.Children.GET.Schemas.Request.Query.Payload.$id
);
ajvInstance.addSchema(
  OccupationAPISpecs.Occupation.Skills.GET.Schemas.Response.Payload,
  OccupationAPISpecs.Occupation.Skills.GET.Schemas.Response.Payload.$id
);
ajvInstance.addSchema(
  OccupationAPISpecs.Occupation.Skills.GET.Schemas.Request.Query.Payload,
  OccupationAPISpecs.Occupation.Skills.GET.Schemas.Request.Query.Payload.$id
);
ajvInstance.addSchema(
  SkillGroupAPISpecs.POST.Schemas.Request.Payload,
  SkillGroupAPISpecs.POST.Schemas.Request.Payload.$id
);
ajvInstance.addSchema(
  SkillGroupAPISpecs.POST.Schemas.Request.Param.Payload,
  SkillGroupAPISpecs.POST.Schemas.Request.Param.Payload.$id
);
ajvInstance.addSchema(
  SkillGroupAPISpecs.GET.Schemas.Request.Param.Payload,
  SkillGroupAPISpecs.GET.Schemas.Request.Param.Payload.$id
);
ajvInstance.addSchema(
  SkillGroupAPISpecs.GET.Schemas.Request.Query.Payload,
  SkillGroupAPISpecs.GET.Schemas.Request.Query.Payload.$id
);
ajvInstance.addSchema(
  SkillGroupAPISpecs.SkillGroup.Schemas.Request.Param.Payload,
  SkillGroupAPISpecs.SkillGroup.Schemas.Request.Param.Payload.$id
);
ajvInstance.addSchema(
  SkillGroupAPISpecs.SkillGroup.GET.Schemas.Response.Payload,
  SkillGroupAPISpecs.SkillGroup.GET.Schemas.Response.Payload.$id
);
ajvInstance.addSchema(
  SkillGroupAPISpecs.SkillGroup.Parent.GET.Schemas.Response.Payload,
  SkillGroupAPISpecs.SkillGroup.Parent.GET.Schemas.Response.Payload.$id
);
ajvInstance.addSchema(
  SkillGroupAPISpecs.SkillGroup.Parent.GET.Schemas.Response.Parents.Payload,
  SkillGroupAPISpecs.SkillGroup.Parent.GET.Schemas.Response.Parents.Payload.$id
);
ajvInstance.addSchema(
  SkillGroupAPISpecs.SkillGroup.Children.GET.Schemas.Request.Query.Payload,
  SkillGroupAPISpecs.SkillGroup.Children.GET.Schemas.Request.Query.Payload.$id
);
ajvInstance.addSchema(
  SkillGroupAPISpecs.SkillGroup.Children.GET.Schemas.Response.Child.Payload,
  SkillGroupAPISpecs.SkillGroup.Children.GET.Schemas.Response.Child.Payload.$id
);
ajvInstance.addSchema(
  SkillGroupAPISpecs.SkillGroup.Children.GET.Schemas.Response.Children.Payload,
  SkillGroupAPISpecs.SkillGroup.Children.GET.Schemas.Response.Children.Payload.$id
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
ajvInstance.addSchema(
  SkillAPISpecs.Schemas.GET.Parents.Request.Query.Payload,
  SkillAPISpecs.Schemas.GET.Parents.Request.Query.Payload.$id
);
ajvInstance.addSchema(
  SkillAPISpecs.Schemas.GET.Children.Request.Query.Payload,
  SkillAPISpecs.Schemas.GET.Children.Request.Query.Payload.$id
);
ajvInstance.addSchema(
  SkillAPISpecs.Schemas.GET.Occupations.Request.Query.Payload,
  SkillAPISpecs.Schemas.GET.Occupations.Request.Query.Payload.$id
);
ajvInstance.addSchema(
  SkillAPISpecs.Schemas.GET.RelatedSkills.Request.Query.Payload,
  SkillAPISpecs.Schemas.GET.RelatedSkills.Request.Query.Payload.$id
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
