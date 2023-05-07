import {SchemaObject} from "ajv";
import {ILocale, LocaleSchema} from "./locale";
import {DESCRIPTION_MAX_LENGTH, NAME_MAX_LENGTH} from "./modelInfo.constants";
import {RegExp_Str_NotEmptyString} from "../regex";

export interface IModelInfoRequest {
  name: string,
  description: string,
  locale: ILocale
}

/**
 *  The base schema for the model info request
 *  This is a workaround the fact that ajv does truly not support inheritance
 *  Using schema composition with allOf does not work as the additionalProperties = fasle
 *  and the suggested solution with unevaluatedProperties = false does not work either
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const _baseRequestSchemaProperties: any = {
  name: {
    description: "The name of the model",
    type: "string",
    pattern: RegExp_Str_NotEmptyString,
    maxLength: NAME_MAX_LENGTH
  },
  description: {
    description: "The description of the model",
    type: "string",
    maxLength: DESCRIPTION_MAX_LENGTH
  },
  locale: {
    $ref: `${LocaleSchema.$id}`
  }
};
export const ModelInfoRequestSchema: SchemaObject = {
  $id: "/components/schemas/modelInfoRequestSchema",
  type: "object",
  additionalProperties: false,
  properties: {
    ..._baseRequestSchemaProperties
  },
  required: [
    "name",
    "description",
    "locale"
  ]

};
