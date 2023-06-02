import {SchemaObject} from "ajv";
import {RegExp_Str_ID, RegExp_Str_NotEmptyString} from "../regex";

export interface ImportRequest {
  modelId: string
  filePaths: { [key in ImportFileTypes]?: string }
}

export enum ImportResponseErrorCodes {
  FAILED_TO_TRIGGER_IMPORT = "FAILED_TO_TRIGGER_IMPORT",
  TRIGGER_IMPORT_COULD_NOT_VALIDATE = "TRIGGER_IMPORT_COULD_NOT_VALIDATE",
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

export const FILEPATH_MAX_LENGTH = 255;
export const ImportRequestSchema: SchemaObject = {
  $id: "/components/schemas/ImportRequestSchema",
  type: "object",
  additionalProperties: false,
  properties: {
    modelId: {
      description: "The id of the model. It can be used to access the model from the server.",
      type: "string",
      pattern: RegExp_Str_ID,
    },
    filePaths: {
      type: "object",
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