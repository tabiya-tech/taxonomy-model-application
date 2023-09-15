import {SchemaObject} from "ajv";
import {RegExp_Str_NotEmptyString} from "../regex";

const SchemaGETResponse: SchemaObject = {
  $id: "/components/schemas/PresignedResponseSchemaGET",

  type: "object",
  additionalProperties: false,
  properties: {
    url: {
      description: "The url to upload the files to",
      type: "string",
      format: "uri",
    },
    fields: {
      description: "The fields should be added to the form-data when uploading the files",
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
    folder: {
      description: "The folder name to upload the files to",
      type: "string",
      pattern: RegExp_Str_NotEmptyString
    },
  },
  required: [
    "url",
    "fields",
    "folder"
  ]
};

export default SchemaGETResponse;