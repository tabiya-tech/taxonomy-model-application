import { SchemaObject } from "ajv";
import { _baseProperties } from "./schema";
import ExportAPI from "../export";
import ModelInfoAPI from "../modelInfo";
import ErrorConstants from "./constants";
import OccupationGroupAPI from "../esco/occupationGroup";
import OccupationAPI from "../esco/occupation";
import SkillGroupAPI from "../esco/skillGroup";
import { RegExp_Str_NotEmptyString } from "../regex";
import SkillsAPI from "../esco/skill";

const ErrorSchemaPOST: SchemaObject = {
  $id: "/components/schemas/ErrorSchemaPOST",
  type: "object",
  properties: {
    errorCode: {
      description: "A code that API consumers can use to determine the type of error that occurred on POST method",
      type: "string",
      enum: Array.from(
        new Set([
          ...Object.values(ErrorConstants.Common.ErrorCodes),
          ...Object.values(ErrorConstants.POST.ErrorCodes),
          ...Object.values(ExportAPI.Enums.POST.Response.ExportResponseErrorCodes),
          ...Object.values(ModelInfoAPI.Enums.POST.Response.ErrorCodes),
          ...Object.values(OccupationGroupAPI.Enums.POST.Response.Status400.ErrorCodes),
          ...Object.values(OccupationGroupAPI.Enums.POST.Response.Status404.ErrorCodes),
          ...Object.values(OccupationGroupAPI.Enums.POST.Response.Status500.ErrorCodes),
          ...Object.values(SkillGroupAPI.Enums.POST.Response.Status400.ErrorCodes),
          ...Object.values(SkillGroupAPI.Enums.POST.Response.Status404.ErrorCodes),
          ...Object.values(SkillGroupAPI.Enums.POST.Response.Status500.ErrorCodes),
          ...Object.values(SkillsAPI.Enums.POST.Response.Status400.ErrorCodes),
          ...Object.values(SkillsAPI.Enums.POST.Response.Status404.ErrorCodes),
          ...Object.values(SkillsAPI.Enums.POST.Response.Status500.ErrorCodes),
          ...Object.values(OccupationAPI.Enums.POST.Response.Status400.ErrorCodes),
          ...Object.values(OccupationAPI.Enums.POST.Response.Status404.ErrorCodes),
          ...Object.values(OccupationAPI.Enums.POST.Response.Status500.ErrorCodes),
        ])
      ),
      pattern: RegExp_Str_NotEmptyString,
    },
    ...JSON.parse(JSON.stringify(_baseProperties)),
  },
  required: ["errorCode", "message", "details"],
  additionalProperties: false,
};

export default ErrorSchemaPOST;
