import {SchemaObject} from "ajv";
import {RegExp_Str_ID, RegExp_Str_NotEmptyString} from "../regex";

export type  ImportFilePaths = { [key in ImportFileTypes]?: string }

export interface ImportRequest {
  modelId: string
  filePaths: ImportFilePaths
}

export enum ImportResponseErrorCodes {
  FAILED_TO_TRIGGER_IMPORT = "FAILED_TO_TRIGGER_IMPORT"
}

export enum ImportFileTypes {
  ESCO_OCCUPATION = "ESCO_OCCUPATION", // <--- occupations_en.csv
  ESCO_SKILL_HIERARCHY = "ESCO_SKILL_HIERARCHY", // <--- broaderRelationsSkillPillar.csv
  ESCO_SKILL_GROUP = "ESCO_SKILL_GROUP", // <-- skillGroups_en.csv
  ESCO_SKILL = "ESCO_SKILL", //<--- skills_en.csv
  ESCO_SKILL_SKILL_RELATIONS = "ESCO_SKILL_SKILL_RELATIONS", // <--- skillSkillRelations.csv
  ISCO_GROUP = "ISCO_GROUP", //<--- ISCOGroups_en.csv
  LOCAL_OCCUPATION = "LOCAL_OCCUPATION",
  LOCALIZED_OCCUPATION = "LOCALIZED_OCCUPATION",
  MODEL_INFO = "MODEL_INFO",
  OCCUPATION_HIERARCHY = "OCCUPATION_HIERARCHY", // <--- broaderRelationsOccPillar.csv
  OCCUPATION_LOGS = "OCCUPATION_LOGS",
  OCCUPATION_LOG_CHANGES = "OCCUPATION_LOG_CHANGES",
  OCCUPATION_SKILL_RELATION = "OCCUPATION_SKILL_RELATION" // <--- occupationSkillRelations.csv
}

export const MAX_PAYLOAD_LENGTH = 4000; // chars

export const FILEPATH_MAX_LENGTH = 255;

export const ImportRequestSchema: SchemaObject = {
  $id: "/components/schemas/ImportRequestSchema",
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
          [ImportFileTypes.ISCO_GROUP]: "some-random-folder/ISCOGroups_en.csv",
          [ImportFileTypes.ESCO_SKILL_GROUP]: "some-random-folder/skillGroups_en.csv",
        }
      ],
      anyOf: Object.values(ImportFileTypes).map(value => {
        return {
          properties: {
            [value]: {
              type: "string",
              maxLength: FILEPATH_MAX_LENGTH,
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