import { SchemaObject } from "ajv";
import { RegExp_Str_ID, RegExp_Str_NotEmptyString } from "../regex";
import ImportConstants from "./constants";

export const SchemaPOSTRequest: SchemaObject = {
  $id: "/components/schemas/ImportRequestSchemaPOST",
  type: "object",
  additionalProperties: false,
  properties: {
    modelId: {
      description: "The identifier of the model for importing the files to.",
      type: "string",
      pattern: RegExp_Str_ID,
    },
    filePaths: {
      description:
        "A key value map of the files to import. The key represents the type of the file, and the value the path to the file. The path is relative to the root of the upload bucket and starts with the folder name that the presigned url was generated for.",
      type: "object",
      examples: [
        {
          [ImportConstants.ImportFileTypes.ISCO_GROUPS]: "some-random-folder/ISCOGroups_en.csv",
          [ImportConstants.ImportFileTypes.ESCO_SKILL_GROUPS]: "some-random-folder/skillGroups_en.csv",
        },
      ],
      anyOf: Object.values(ImportConstants.ImportFileTypes).map((value) => {
        return {
          properties: {
            [value]: {
              type: "string",
              maxLength: ImportConstants.FILEPATH_MAX_LENGTH,
              pattern: RegExp_Str_NotEmptyString,
            },
          },
          required: [value],
        };
      }),
    },
  },
  required: ["modelId", "filePaths"],
};

export default SchemaPOSTRequest;
