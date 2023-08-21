import {SchemaObject} from "ajv";
import {RegExp_Str_NotEmptyString} from "../regex";
import {ImportResponseErrorCodes} from "../import";
import {ModelInfo} from "../modelInfo";
import {ErrorCodes} from "./ErrorCodes";

export interface IErrorResponse {
  errorCode: ErrorCodes | ImportResponseErrorCodes | ModelInfo.POST.Response.ErrorCodes | ModelInfo.GET.Response.ErrorCodes, // The UI could use to display some useful information
  message: string, // The error message offers better developer experience. UI should not display this message.
  details: string, // This may be some cryptic message only a developer can understand
}

export const ErrorResponseSchema: SchemaObject = {
  $id: "/components/schemas/ErrorResponseSchema",
  type: "object",
  properties: {
    errorCode: {
      description: "A code that API consumers can use to determine the type of error that occurred",
      type: "string",
      enum: [Object.values(ErrorCodes), Object.values(ImportResponseErrorCodes), Object.values(ModelInfo.POST.Response.ErrorCodes)].flat(),
      pattern: RegExp_Str_NotEmptyString,
    },
    message: {
      description: "A human readable description of the error",
      type: "string"
    },
    details: {
      description: "Additional details about the error. Might be an empty string if no additional details are available",
      type: "string"
    }
  },
  required: [
    "errorCode",
    "message",
    "details",
  ],
  additionalProperties: false
};