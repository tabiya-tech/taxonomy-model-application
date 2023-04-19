import {SchemaObject} from "ajv";
import {RegExp_Str_NotEmptyString} from "../regex";

export interface IPresignedResponse {
  url: string,
  fields: {name: string, value: string}[],
  key: string,
}

export const PresignedResponseSchema: SchemaObject = {
  $id: "/components/schemas/presignedResponseSchema",

  type: "object",
  additionalProperties: false,
  properties: {
    url: {
      description: "The url to upload the files to",
      type: "string",
      format: "uri",
    },
    fields: {
      description: "The fields to upload the files to",
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            pattern: RegExp_Str_NotEmptyString,
          },
          value: {
            type: "string",
            pattern: RegExp_Str_NotEmptyString,
          },
        },
        required: [
          "name",
          "value",
        ],
      }
    },
    key: {
      description: "",
      type: "string",
      pattern: RegExp_Str_NotEmptyString
    },
  },
  required: [
    "url",
    "fields",
    "key"
  ]
};