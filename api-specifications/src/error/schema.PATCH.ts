import { SchemaObject } from "ajv";
import { _baseProperties } from "./schema";
import ModelInfoAPI from "../modelInfo";
import OccupationAPI from "../esco/occupation";
import ErrorConstants from "./constants";
import { RegExp_Str_NotEmptyString } from "../regex";

const ErrorSchemaPATCH: SchemaObject = {
  $id: "/components/schemas/ErrorSchemaPATCH",
  type: "object",
  properties: {
    errorCode: {
      description: "A code that API consumers can use to determine the type of error that occurred on PATCH method",
      type: "string",
      enum: Array.from(
        new Set([
          ...Object.values(ErrorConstants.Common.ErrorCodes),
          ...Object.values(ErrorConstants.PATCH.ErrorCodes),
          ...Object.values(OccupationAPI.Occupation.PATCH.Errors.Status400.ErrorCodes),
          ...Object.values(OccupationAPI.Occupation.PATCH.Errors.Status404.ErrorCodes),
          ...Object.values(OccupationAPI.Occupation.PATCH.Errors.Status500.ErrorCodes),
          ...Object.values(ModelInfoAPI.ModelInfo.PATCH.Enums.Response.Status400.ErrorCodes),
          ...Object.values(ModelInfoAPI.ModelInfo.PATCH.Enums.Response.Status404.ErrorCodes),
          ...Object.values(ModelInfoAPI.ModelInfo.PATCH.Enums.Response.Status409.ErrorCodes),
          ...Object.values(ModelInfoAPI.ModelInfo.PATCH.Enums.Response.Status500.ErrorCodes),
        ])
      ),
      pattern: RegExp_Str_NotEmptyString,
    },
    ...JSON.parse(JSON.stringify(_baseProperties)),
  },
  required: ["errorCode", "message", "details"],
  additionalProperties: false,
};

export default ErrorSchemaPATCH;
