import { SchemaObject } from "ajv";
import { RegExp_Str_NotEmptyString } from "../regex";
import ImportAPI from "../import";
import ExportAPI from "../export";
import ModelInfoAPI from "../modelInfo";
import ErrorConstants from "./constants";
import OccupationGroupAPI from "../esco/occupationGroup";
import OccupationAPI from "../esco/occupation";

export const ErrorSchema: SchemaObject = {
  $id: "/components/schemas/ErrorSchema",
  type: "object",
  properties: {
    errorCode: {
      description: "A code that API consumers can use to determine the type of error that occurred",
      type: "string",
      enum: [
        Object.values(ErrorConstants.ErrorCodes),
        Object.values(ImportAPI.Enums.ImportResponseErrorCodes),
        Object.values(ExportAPI.Enums.POST.Response.ExportResponseErrorCodes),
        Object.values(ModelInfoAPI.Enums.POST.Response.ErrorCodes),
        Object.values(OccupationGroupAPI.Enums.POST.Response.ErrorCodes),
        Object.values(OccupationGroupAPI.Enums.GET.Response.ErrorCodes),
        Object.values(OccupationAPI.Enums.POST.Response.ErrorCodes),
        Object.values(OccupationAPI.Enums.GET.Response.ErrorCodes),
      ].flat(),
      pattern: RegExp_Str_NotEmptyString,
    },
    message: {
      description: "A human readable description of the error",
      type: "string",
      maxLength: ErrorConstants.MAX_MESSAGE_LENGTH,
    },
    details: {
      description:
        "Additional details about the error. Might be an empty string if no additional details are available",
      type: "string",
      maxLength: ErrorConstants.MAX_DETAILS_LENGTH,
    },
  },
  required: ["errorCode", "message", "details"],
  additionalProperties: false,
};

export default ErrorSchema;
