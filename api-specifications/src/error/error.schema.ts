import {SchemaObject} from "ajv";
import {RegExp_Str_NotEmptyString} from "../regex";
import ImportRequest from "../import";
import ModelInfo from "../modelInfo";
import {ErrorCodes} from "./error.constants";

export const ErrorResponseSchemaPOST: SchemaObject = {
  $id: "/components/schemas/ErrorSchema",
  type: "object",
  properties: {
    errorCode: {
      description: "A code that API consumers can use to determine the type of error that occurred",
      type: "string",
      enum: [Object.values(ErrorCodes), Object.values(ImportRequest.POST.Response.Constants.ImportResponseErrorCodes), Object.values(ModelInfo.POST.Response.Constants.ErrorCodes)].flat(),
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

export default ErrorResponseSchemaPOST;