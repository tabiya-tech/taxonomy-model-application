import { SchemaObject } from "ajv";
import { _baseProperties } from "./schema";
import ErrorConstants from "./constants";
import { RegExp_Str_NotEmptyString } from "../regex";

const ErrorSchemaPATCH: SchemaObject = {
  $id: "/components/schemas/ErrorSchemaPATCH",
  type: "object",
  properties: {
    errorCode: {
      description: "A code that API consumers can use to determine the type of error that occurred on PATCH method",
      type: "string",
      enum: [Object.values(ErrorConstants.Common.ErrorCodes), Object.values(ErrorConstants.PATCH.ErrorCodes)].flat(),
      pattern: RegExp_Str_NotEmptyString,
    },
    ...JSON.parse(JSON.stringify(_baseProperties)),
  },
  required: ["errorCode", "message", "details"],
  additionalProperties: false,
};

export default ErrorSchemaPATCH;
