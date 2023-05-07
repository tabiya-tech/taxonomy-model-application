import {SchemaObject} from "ajv";
import {RegExp_Str_NotEmptyString} from "../regex";

export interface IErrorResponse {
  errorCode: string, // The UI could use to display some useful information
  message: string, // The error message offers better developer experience. UI should not display this message.
  details: string, // This may be some cryptic message only a developer can understand
}

export const ErrorResponseSchema: SchemaObject = {
  $id: "/components/schemas/errorResponseSchema",
  type: "object",
  properties: {
    errorCode: {
      "type": "string",
      pattern: RegExp_Str_NotEmptyString,
    },
    message: {
      "type": "string"
    },
    details: {
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
