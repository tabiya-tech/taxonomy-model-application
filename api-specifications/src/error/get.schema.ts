import ErrorTypes from "./types";
import { SchemaObject } from "ajv";
import { RegExp_Str_NotEmptyString } from "../regex";
import { _baseProperties } from "./schema";

export const GetErrorSchema = (
  method: ErrorTypes.METHODS,
  schemaName: string,
  code: ErrorTypes.Codes,
  errorCodes: Array<string>
): SchemaObject => ({
  $id: `/components/schemas/${method}${schemaName}${code}ErrorSchema`,
  type: "object",
  properties: {
    errorCode: {
      description: `A code that API consumers can use to determine the ${schemaName} ${code} for ${method} error that occurred`,
      type: "string",
      enum: errorCodes,
      pattern: RegExp_Str_NotEmptyString,
    },
    ...JSON.parse(JSON.stringify(_baseProperties)),
  },
  required: ["errorCode", "message", "details"],
  additionalProperties: false,
});
