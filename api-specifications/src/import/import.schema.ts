import {SchemaObject} from "ajv";
import * as ImportRequestTypes from "./import.types";
import * as Constants from "./import.constants";
import {RegExp_Str_ID, RegExp_Str_NotEmptyString} from "../regex";

export const ImportRequestReSchemaPOST: SchemaObject = {
  $id: "/components/schemas/ImportSchema",
  type: "object",
  additionalProperties: false,
  properties: {
    modelId: {
      description: "The identifier of the model for importing the files to.",
      type: "string",
      pattern: RegExp_Str_ID,
    },
    filePaths: {
      description: "A key value map of the files to import. The key represents the type of the file, and the value the path to the file. The path is relative to the root of the upload bucket and starts with the folder name that the presigned url was generated for.",
      type: "object",
      examples: [
        {
          [ImportRequestTypes.ImportFileTypes.ISCO_GROUP]: "some-random-folder/ISCOGroups_en.csv",
          [ImportRequestTypes.ImportFileTypes.ESCO_SKILL_GROUP]: "some-random-folder/skillGroups_en.csv",
        }
      ],
      anyOf: Object.values(ImportRequestTypes.ImportFileTypes).map(value => {
        return {
          properties: {
            [value]: {
              type: "string",
              maxLength: Constants.FILEPATH_MAX_LENGTH,
              pattern: RegExp_Str_NotEmptyString
            }
          },
          required: [value]
        };
      })
    },
  },
  required: [
    "modelId",
    "filePaths",
  ]
};

export namespace ImportSchema {
  export namespace POST {
    export const Request = ImportRequestReSchemaPOST;
  }
}
