import { SchemaObject } from "ajv";
import { RegExp_Str_NotEmptyString } from "../regex";
import ImportAPI from "../import";
import ModelInfoAPI from "../modelInfo";
import ErrorConstants from "./constants";

export const ErrorSchema: SchemaObject = {
  $id: "/components/schemas/ErrorSchema",
  type: "object",
  properties: {
    errorCode: {
      description:
        "A code that API consumers can use to determine the type of error that occurred",
      type: "string",
      enum: [
        Object.values(ErrorConstants.ErrorCodes),
        Object.values(ImportAPI.Enums.ImportResponseErrorCodes),
        Object.values(ModelInfoAPI.Enums.POST.Response.ErrorCodes),
      ].flat(),
      pattern: RegExp_Str_NotEmptyString,
    },
    message: {
      description: "A human readable description of the error",
      type: "string",
    },
    details: {
      description:
        "Additional details about the error. Might be an empty string if no additional details are available",
      type: "string",
    },
  },
  required: ["errorCode", "message", "details"],
  additionalProperties: false,
};

export default ErrorSchema;
