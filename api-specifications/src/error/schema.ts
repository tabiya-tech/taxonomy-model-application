import { SchemaObject } from "ajv";
import { RegExp_Str_NotEmptyString } from "../regex";
import ImportAPI from "../import";
import ExportAPI from "../export";
import ModelInfoAPI from "../modelInfo";
import ErrorConstants from "./constants";
import OccupationGroupAPI from "../esco/occupationGroup";
import OccupationAPI from "../esco/occupation";
import SkillGroupAPI from "../esco/skillGroup";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const _baseProperties: any = {
  message: {
    description: "A human readable description of the error",
    type: "string",
    maxLength: ErrorConstants.MAX_MESSAGE_LENGTH,
  },
  details: {
    description: "Additional details about the error. Might be an empty string if no additional details are available",
    type: "string",
    maxLength: ErrorConstants.MAX_DETAILS_LENGTH,
  },
};

export const ErrorSchema: SchemaObject = {
  $id: "/components/schemas/ErrorSchema",
  type: "object",
  properties: {
    errorCode: {
      description: "A code that API consumers can use to determine the type of error that occurred",
      type: "string",
      enum: Array.from(
        new Set([
          ...Object.values(ErrorConstants.ErrorCodes),
          ...Object.values(ImportAPI.Enums.ImportResponseErrorCodes),
          ...Object.values(ExportAPI.Enums.POST.Response.ExportResponseErrorCodes),
          ...Object.values(ModelInfoAPI.Enums.POST.Response.ErrorCodes),
          ...Object.values(OccupationGroupAPI.Enums.POST.Response.Status400.ErrorCodes),
          ...Object.values(OccupationGroupAPI.Enums.POST.Response.Status404.ErrorCodes),
          ...Object.values(OccupationGroupAPI.Enums.POST.Response.Status500.ErrorCodes),
          ...Object.values(OccupationGroupAPI.Enums.GET.Response.Status400.ErrorCodes),
          ...Object.values(OccupationGroupAPI.Enums.GET.Response.Status404.ErrorCodes),
          ...Object.values(OccupationGroupAPI.Enums.GET.Response.Status500.ErrorCodes),
          ...Object.values(OccupationAPI.Enums.POST.Response.Status400.ErrorCodes),
        Object.values(OccupationAPI.Enums.POST.Response.Status404.ErrorCodes),
        Object.values(OccupationAPI.Enums.POST.Response.Status500.ErrorCodes),
        Object.values(OccupationAPI.Enums.GET.Response.Status400.ErrorCodes),
          ...Object.values(OccupationAPI.Enums.GET.Response.Status404.ErrorCodes),
        Object.values(OccupationAPI.Enums.GET.Response.Status500.ErrorCodes),
          ...Object.values(SkillGroupAPI.Enums.POST.Response.Status400.ErrorCodes),
          ...Object.values(SkillGroupAPI.Enums.POST.Response.Status404.ErrorCodes),
          ...Object.values(SkillGroupAPI.Enums.POST.Response.Status500.ErrorCodes),
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

export default ErrorSchema;
