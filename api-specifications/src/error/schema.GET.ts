import { SchemaObject } from "ajv";
import { _baseProperties } from "./schema";
import ModelInfoAPI from "../modelInfo";
import ErrorConstants from "./constants";
import OccupationGroupAPI from "../esco/occupationGroup";
import OccupationAPI from "../esco/occupation";
import SkillGroupAPI from "../esco/skillGroup";
import SkillsAPI from "../esco/skill";
import { RegExp_Str_NotEmptyString } from "../regex";

const ErrorSchemaGET: SchemaObject = {
  $id: "/components/schemas/ErrorSchemaGET",
  type: "object",
  properties: {
    errorCode: {
      description: "A code that API consumers can use to determine the type of error that occurred on GET method",
      type: "string",
      enum: Array.from(
        new Set([
          ...Object.values(ErrorConstants.Common.ErrorCodes),
          ...Object.values(ErrorConstants.GET.ErrorCodes),
          ...Object.values(ModelInfoAPI.Enums.GET.Response.ErrorCodes),
          ...Object.values(OccupationGroupAPI.GET.Enums.Response.Status400.ErrorCodes),
          ...Object.values(OccupationGroupAPI.GET.Enums.Response.Status404.ErrorCodes),
          ...Object.values(OccupationGroupAPI.GET.Enums.Response.Status500.ErrorCodes),
          ...Object.values(OccupationGroupAPI.OccupationGroup.GET.Enums.Response.Status400.ErrorCodes),
          ...Object.values(OccupationGroupAPI.OccupationGroup.GET.Enums.Response.Status404.ErrorCodes),
          ...Object.values(OccupationGroupAPI.OccupationGroup.GET.Enums.Response.Status500.ErrorCodes),
          ...Object.values(OccupationGroupAPI.OccupationGroup.Parent.GET.Enums.Response.Status400.ErrorCodes),
          ...Object.values(OccupationGroupAPI.OccupationGroup.Parent.GET.Enums.Response.Status404.ErrorCodes),
          ...Object.values(OccupationGroupAPI.OccupationGroup.Parent.GET.Enums.Response.Status500.ErrorCodes),
          ...Object.values(OccupationGroupAPI.OccupationGroup.Children.GET.Enums.Response.Status400.ErrorCodes),
          ...Object.values(OccupationGroupAPI.OccupationGroup.Children.GET.Enums.Response.Status404.ErrorCodes),
          ...Object.values(OccupationGroupAPI.OccupationGroup.Children.GET.Enums.Response.Status500.ErrorCodes),
          ...Object.values(OccupationAPI.GET.Errors.Status400.ErrorCodes),
          ...Object.values(OccupationAPI.GET.Errors.Status404.ErrorCodes),
          ...Object.values(OccupationAPI.GET.Errors.Status500.ErrorCodes),
          ...Object.values(OccupationAPI.Occupation.Parent.GET.Errors.Status400.ErrorCodes),
          ...Object.values(OccupationAPI.Occupation.Parent.GET.Errors.Status404.ErrorCodes),
          ...Object.values(OccupationAPI.Occupation.Parent.GET.Errors.Status500.ErrorCodes),
          ...Object.values(OccupationAPI.Occupation.Children.GET.Errors.Status400.ErrorCodes),
          ...Object.values(OccupationAPI.Occupation.Children.GET.Errors.Status404.ErrorCodes),
          ...Object.values(OccupationAPI.Occupation.Children.GET.Errors.Status500.ErrorCodes),
          ...Object.values(OccupationAPI.Occupation.Skills.GET.Errors.Status400.ErrorCodes),
          ...Object.values(OccupationAPI.Occupation.Skills.GET.Errors.Status404.ErrorCodes),
          ...Object.values(OccupationAPI.Occupation.Skills.GET.Errors.Status500.ErrorCodes),
          ...Object.values(SkillsAPI.Enums.GET.Response.Status400.ErrorCodes),
          ...Object.values(SkillsAPI.Enums.GET.Response.Status404.ErrorCodes),
          ...Object.values(SkillsAPI.Enums.GET.Response.Status500.ErrorCodes),
          ...Object.values(SkillGroupAPI.GET.Enums.Response.Status400.ErrorCodes),
          ...Object.values(SkillGroupAPI.GET.Enums.Response.Status404.ErrorCodes),
          ...Object.values(SkillGroupAPI.GET.Enums.Response.Status500.ErrorCodes),
          ...Object.values(SkillGroupAPI.SkillGroup.GET.Enums.Response.Status400.ErrorCodes),
          ...Object.values(SkillGroupAPI.SkillGroup.GET.Enums.Response.Status404.ErrorCodes),
          ...Object.values(SkillGroupAPI.SkillGroup.GET.Enums.Response.Status500.ErrorCodes),
          ...Object.values(SkillGroupAPI.SkillGroup.Parent.GET.Enums.Response.Status400.ErrorCodes),
          ...Object.values(SkillGroupAPI.SkillGroup.Parent.GET.Enums.Response.Status404.ErrorCodes),
          ...Object.values(SkillGroupAPI.SkillGroup.Parent.GET.Enums.Response.Status500.ErrorCodes),
          ...Object.values(SkillGroupAPI.SkillGroup.Children.GET.Enums.Response.Status400.ErrorCodes),
          ...Object.values(SkillGroupAPI.SkillGroup.Children.GET.Enums.Response.Status404.ErrorCodes),
          ...Object.values(SkillGroupAPI.SkillGroup.Children.GET.Enums.Response.Status500.ErrorCodes),
        ])
      ),
      pattern: RegExp_Str_NotEmptyString,
    },
    ...JSON.parse(JSON.stringify(_baseProperties)),
  },
  required: ["errorCode", "message", "details"],
  additionalProperties: false,
};
export default ErrorSchemaGET;
