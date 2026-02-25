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
          ...Object.values(OccupationGroupAPI.Enums.GET.Response.Status400.ErrorCodes),
          ...Object.values(OccupationGroupAPI.Enums.GET.Response.Status404.ErrorCodes),
          ...Object.values(OccupationGroupAPI.Enums.GET.Response.Status500.ErrorCodes),
          ...Object.values(OccupationAPI.Enums.GET.Response.Status400.ErrorCodes),
          ...Object.values(OccupationAPI.Enums.GET.Response.Status404.ErrorCodes),
          ...Object.values(OccupationAPI.Enums.GET.Response.Status500.ErrorCodes),
          ...Object.values(SkillsAPI.Enums.GET.Response.Status400.ErrorCodes),
          ...Object.values(SkillsAPI.Enums.GET.Response.Status404.ErrorCodes),
          ...Object.values(SkillsAPI.Enums.GET.Response.Status500.ErrorCodes),
          ...Object.values(SkillGroupAPI.Enums.GET.Response.Status400.ErrorCodes),
          ...Object.values(SkillGroupAPI.Enums.GET.Response.Status404.ErrorCodes),
          ...Object.values(SkillGroupAPI.Enums.GET.Response.Status500.ErrorCodes),
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
