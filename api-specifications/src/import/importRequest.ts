import {SchemaObject} from "ajv";
import {RegExp_Str_ID} from "../regex";

export interface ImportRequest {
  modelId: string
  urls: { [key in ImportFileTypes]?: string }
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
    urls: {
      type: "object",
      // properties: {
      //   ESCO_OCCUPATION: {
      //     type: "string",
      //     format: "uri"
      //   },
      //   ESCO_SKILL_HIERARCHY: {
      //     type: "string",
      //     format: "uri"
      //   },
      //   ESCO_SKILL_GROUP: {
      //     type: "string",
      //     format: "uri"
      //   },
      //   ESCO_SKILL: {
      //     type: "string",
      //     format: "uri"
      //   },
      //   ESCO_SKILL_SKILL_RELATIONS: {
      //     type: "string",
      //     format: "uri"
      //   },
      //   ISCO_GROUP: {
      //     type: "string",
      //     format: "uri"
      //   },
      //   LOCAL_OCCUPATION: {
      //     type: "string",
      //     format: "uri"
      //   },
      //   LOCALIZED_OCCUPATION: {
      //     type: "string",
      //     format: "uri"
      //   },
      //   MODEL_INFO: {
      //     type: "string",
      //     format: "uri"
      //   },
      //   OCCUPATION_HIERARCHY: {
      //     type: "string",
      //     format: "uri"
      //   },
      //   OCCUPATION_LOGS: {
      //     type: "string",
      //     format: "uri"
      //   },
      //   OCCUPATION_LOG_CHANGES: {
      //     type: "string",
      //     format: "uri"
      //   },
      //   OCCUPATION_SKILL_RELATION: {
      //     type: "string",
      //     format: "uri"
      //   }
      // },
      anyOf: [{
        properties: {
          ESCO_OCCUPATION: {
            type: "string",
            format: "uri"
          }
        },
        required: ['ESCO_OCCUPATION']
      },
        {
          properties: {
            ESCO_SKILL_HIERARCHY: {
              type: "string",
              format: "uri"
            },
          },
          required: ['ESCO_SKILL_HIERARCHY']
        },
        {
          properties: {
            ESCO_SKILL_GROUP: {
              type: "string",
              format: "uri"
            },
          },
          required: ['ESCO_SKILL_GROUP']
        },
        {
          properties: {
            ESCO_SKILL: {
              type: "string",
              format: "uri"
            },
          },
          required: ['ESCO_SKILL']
        },
        {
          properties: {
            ESCO_SKILL_SKILL_RELATIONS: {
              type: "string",
              format: "uri"
            },
          },
          required: ['ESCO_SKILL_SKILL_RELATIONS']
        },
        {
          properties: {
            ISCO_GROUP: {
              type: "string",
              format: "uri"
            },
          },
          required: ['ISCO_GROUP']
        },
        {
          properties: {
            LOCAL_OCCUPATION: {
              type: "string",
              format: "uri"
            },
          },
          required: ['LOCAL_OCCUPATION']
        },
        {
          properties: {
            LOCALIZED_OCCUPATION: {
              type: "string",
              format: "uri"
            },
          },
          required: ['LOCALIZED_OCCUPATION']
        },
        {
          properties: {
            MODEL_INFO: {
              type: "string",
              format: "uri"
            },
          },
          required: ['MODEL_INFO']
        },
        {
          properties: {
            OCCUPATION_HIERARCHY: {
              type: "string",
              format: "uri"
            },
          },
          required: ['OCCUPATION_HIERARCHY']
        },
        {
          properties: {
            OCCUPATION_LOGS: {
              type: "string",
              format: "uri"
            },
          },
          required: ['OCCUPATION_LOGS']
        },
        {
          properties: {
            OCCUPATION_LOG_CHANGES: {
              type: "string",
              format: "uri"
            },
          },
          required: ['OCCUPATION_LOG_CHANGES']
        },
        {
          properties: {
            OCCUPATION_SKILL_RELATION: {
              type: "string",
              format: "uri"
            },
          },
          required: ['OCCUPATION_SKILL_RELATION']
        }
      ]
    },
  },
  required: [
    "modelId",
    "urls"
  ]
};