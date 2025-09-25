import { RegExp_Str_NotEmptyString, RegExp_Str_UUIDv4, RegExp_Str_ID } from "../../regex";
import OccupationConstants from "./constants";
import OccupationEnums from "./enums";
import OccupationRegexes from "./regex";

export const _baseProperties = {
  UUIDHistory: {
    description: "The UUIDs history of the occupation.",
    type: "array",
    minItems: 0,
    maxItems: OccupationConstants.UUID_HISTORY_MAX_ITEMS,
    uniqueItems: true,
    items: {
      type: "string",
      pattern: RegExp_Str_UUIDv4,
      maxLength: OccupationConstants.UUID_HISTORY_MAX_LENGTH,
    },
  },
  originUri: {
    description: "The origin URI of the occupation.",
    type: "string",
    format: "uri",
    maxLength: OccupationConstants.ORIGIN_URI_MAX_LENGTH,
    pattern: RegExp_Str_NotEmptyString,
  },
  occupationType: {
    description: "The occupation classification type (e.g., ESCOOccupation or LocalOccupation).",
    type: "string",
    enum: Object.values(OccupationEnums.OccupationType),
  },
  code: {
    description: "The code of the occupation.",
    type: "string",
    maxLength: OccupationConstants.CODE_MAX_LENGTH,
  },
  occupationGroupCode: {
    description: "The code of the parent occupation group.",
    type: "string",
    maxLength: OccupationConstants.OCCUPATION_GROUP_CODE_MAX_LENGTH,
  },
  preferredLabel: {
    description: "The preferred label of the occupation.",
    type: "string",
    maxLength: OccupationConstants.PREFERRED_LABEL_MAX_LENGTH,
    pattern: RegExp_Str_NotEmptyString,
  },
  altLabels: {
    description: "Alternative labels for the occupation.",
    type: "array",
    minItems: 0,
    maxItems: OccupationConstants.ALT_LABELS_MAX_ITEMS,
    uniqueItems: true,
    items: {
      type: "string",
      maxLength: OccupationConstants.ALT_LABEL_MAX_LENGTH,
    },
  },
  definition: {
    description: "The formal definition of the occupation.",
    type: "string",
    maxLength: OccupationConstants.DEFINITION_MAX_LENGTH,
  },
  description: {
    description: "Additional descriptive information about the occupation.",
    type: "string",
    maxLength: OccupationConstants.DESCRIPTION_MAX_LENGTH,
  },
  regulatedProfessionNote: {
    description: "Regulatory information for legally regulated professions.",
    type: "string",
    maxLength: OccupationConstants.REGULATED_PROFESSION_NOTE_MAX_LENGTH,
  },
  scopeNote: {
    description: "Scope clarification for the occupation's application.",
    type: "string",
    maxLength: OccupationConstants.SCOPE_NOTE_MAX_LENGTH,
  },
  isLocalized: {
    description: "Indicates if the occupation has localized variants. Must be false for LocalOccupation.",
    type: "boolean",
  },
  modelId: {
    description: "The identifier of the model containing this occupation.",
    type: "string",
    pattern: RegExp_Str_ID,
  },
};

export const _baseOccupationURLParameter = {
  modelId: {
    description: "The identifier of the model for occupation.",
    type: "string",
    pattern: RegExp_Str_ID,
  },
};

export const _baseOccupationURLParameterWithId = {
  ...JSON.parse(JSON.stringify(_baseOccupationURLParameter)),
  id: {
    description: "The id of the occupation. It can be used to retrieve the occupation from the server.",
    type: "string",
    pattern: RegExp_Str_ID,
  },
};

export const _baseQueryParameterSchema = {
  limit: {
    description: "The maximum number of items to return.",
    type: "integer",
    minimum: 1,
    maximum: OccupationConstants.MAX_LIMIT,
    default: OccupationConstants.MAX_LIMIT,
  },
  next_cursor: {
    description: "A base64 string representing the next_cursor for pagination.",
    type: "string",
    maxLength: OccupationConstants.MAX_CURSOR_LENGTH,
    pattern: RegExp_Str_NotEmptyString,
  },
};

// Top-level validation for occupationType
const topLevelOccupationCodeConditions = [
  {
    if: { properties: { occupationType: { const: OccupationEnums.OccupationType.ESCOOccupation } } },
    then: {
      properties: {
        code: {
          type: "string",
          pattern: OccupationRegexes.Str.ESCO_OCCUPATION_CODE,
          maxLength: OccupationConstants.CODE_MAX_LENGTH,
        },
        occupationGroupCode: {
          type: "string",
          pattern: OccupationRegexes.Str.ISCO_GROUP_CODE,
          maxLength: OccupationConstants.OCCUPATION_GROUP_CODE_MAX_LENGTH,
        },
      },
    },
  },
  {
    if: { properties: { occupationType: { const: OccupationEnums.OccupationType.LocalOccupation } } },
    then: {
      properties: {
        code: {
          type: "string",
          pattern: OccupationRegexes.Str.ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE,
          maxLength: OccupationConstants.CODE_MAX_LENGTH,
        },
        occupationGroupCode: {
          type: "string",
          pattern: OccupationRegexes.Str.LOCAL_GROUP_CODE,
          maxLength: OccupationConstants.OCCUPATION_GROUP_CODE_MAX_LENGTH,
        },
      },
    },
  },
];

// Parent/children validation for objectType
const nestedOccupationCodeConditions = [
  {
    if: { properties: { objectType: { const: OccupationEnums.ObjectTypes.ISCOGroup } } },
    then: {
      properties: {
        code: {
          type: "string",
          pattern: OccupationRegexes.Str.ISCO_GROUP_CODE,
          maxLength: OccupationConstants.CODE_MAX_LENGTH,
        },
        occupationGroupCode: {
          type: "string",
          pattern: OccupationRegexes.Str.ISCO_GROUP_CODE,
          maxLength: OccupationConstants.OCCUPATION_GROUP_CODE_MAX_LENGTH,
        },
      },
    },
  },
  {
    if: { properties: { objectType: { const: OccupationEnums.ObjectTypes.LocalGroup } } },
    then: {
      properties: {
        code: {
          type: "string",
          pattern: OccupationRegexes.Str.LOCAL_GROUP_CODE,
          maxLength: OccupationConstants.CODE_MAX_LENGTH,
        },
        occupationGroupCode: {
          type: "string",
          pattern: OccupationRegexes.Str.LOCAL_GROUP_CODE,
          maxLength: OccupationConstants.OCCUPATION_GROUP_CODE_MAX_LENGTH,
        },
      },
    },
  },
  {
    if: { properties: { objectType: { const: OccupationEnums.ObjectTypes.ESCOOccupation } } },
    then: {
      properties: {
        code: {
          type: "string",
          pattern: OccupationRegexes.Str.ESCO_OCCUPATION_CODE,
          maxLength: OccupationConstants.CODE_MAX_LENGTH,
        },
        occupationGroupCode: {
          type: "string",
          pattern: OccupationRegexes.Str.ISCO_GROUP_CODE,
          maxLength: OccupationConstants.OCCUPATION_GROUP_CODE_MAX_LENGTH,
        },
      },
    },
  },
  {
    if: { properties: { objectType: { const: OccupationEnums.ObjectTypes.LocalOccupation } } },
    then: {
      properties: {
        code: {
          type: "string",
          pattern: OccupationRegexes.Str.ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE,
          maxLength: OccupationConstants.CODE_MAX_LENGTH,
        },
        occupationGroupCode: {
          type: "string",
          pattern: OccupationRegexes.Str.LOCAL_GROUP_CODE,
          maxLength: OccupationConstants.OCCUPATION_GROUP_CODE_MAX_LENGTH,
        },
      },
    },
  },
];

export const _baseResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: {
      description: "The unique identifier of the occupation.",
      type: "string",
      pattern: RegExp_Str_ID,
    },
    UUID: {
      description: "The UUID of the occupation for cross-system identification.",
      type: "string",
      pattern: RegExp_Str_UUIDv4,
    },
    originUUID: {
      description: "The original UUID of the occupation, i.e., the first UUID in UUIDHistory",
      type: "string",
      pattern: RegExp_Str_UUIDv4,
      maxLength: OccupationConstants.UUID_HISTORY_MAX_LENGTH,
    },
    path: {
      description: "Resource path using the occupation's ID.",
      type: "string",
      format: "uri",
      pattern: "^https://.*",
      maxLength: OccupationConstants.PATH_URI_MAX_LENGTH,
    },
    tabiyaPath: {
      description: "Resource path using the occupation's UUID.",
      type: "string",
      format: "uri",
      pattern: "^https://.*",
      maxLength: OccupationConstants.TABIYA_PATH_URI_MAX_LENGTH,
    },
    parent: {
      description: "The parent occupation of this occupation.",
      type: "object",
      additionalProperties: false,
      properties: {
        id: {
          description: "The id of the parent occupation.",
          type: "string",
          pattern: RegExp_Str_ID,
        },
        UUID: {
          description: "The UUID of the occupation. It can be used to identify the parent occupation.",
          type: "string",
          pattern: RegExp_Str_UUIDv4,
        },
        code: {
          description: "The code of the parent occupation.",
          type: "string",
          maxLength: OccupationConstants.CODE_MAX_LENGTH,
        },
        occupationGroupCode: {
          description: "The code of the parent occupation group.",
          type: "string",
          maxLength: OccupationConstants.OCCUPATION_GROUP_CODE_MAX_LENGTH,
        },
        preferredLabel: {
          description: "The preferred label of the parent occupation.",
          type: "string",
          maxLength: OccupationConstants.PREFERRED_LABEL_MAX_LENGTH,
          pattern: RegExp_Str_NotEmptyString,
        },
        objectType: {
          description: "The type of the occupation, e.g., ISCOGroup or LocalGroup.",
          type: "string",
          enum: Object.values(OccupationEnums.ObjectTypes),
        },
      },
      allOf: nestedOccupationCodeConditions,
    },
    children: {
      description: "The children of this occupation.",
      type: "array",
      minItems: 0,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { description: "The id of the child occupation.", type: "string", pattern: RegExp_Str_ID },
          UUID: { description: "The UUID of the child occupation.", type: "string", pattern: RegExp_Str_UUIDv4 },
          code: {
            description: "The code of the child occupation.",
            type: "string",
            maxLength: OccupationConstants.CODE_MAX_LENGTH,
          },
          occupationGroupCode: {
            description: "The code of the child occupation group.",
            type: "string",
            maxLength: OccupationConstants.OCCUPATION_GROUP_CODE_MAX_LENGTH,
          },
          preferredLabel: {
            description: "The preferred label of the child occupation.",
            type: "string",
            maxLength: OccupationConstants.PREFERRED_LABEL_MAX_LENGTH,
            pattern: RegExp_Str_NotEmptyString,
          },
          objectType: {
            description: "The type of the occupation, e.g., ISCOGroup or LocalGroup.",
            type: "string",
            enum: Object.values(OccupationEnums.ObjectTypes),
          },
        },
        allOf: nestedOccupationCodeConditions,
      },
    },
    requiresSkills: {
      description: "Skills required for this occupation with relationship metadata.",
      type: "array",
      minItems: 0,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { description: "The ID of the required skill.", type: "string", pattern: RegExp_Str_ID },
          UUID: { description: "The UUID of the required skill.", type: "string", pattern: RegExp_Str_UUIDv4 },
          preferredLabel: {
            description: "The preferred label of the required skill.",
            type: "string",
            maxLength: OccupationConstants.PREFERRED_LABEL_MAX_LENGTH,
            pattern: RegExp_Str_NotEmptyString,
          },
          isLocalized: { description: "Indicates if the required skill is localized.", type: "boolean" },
          objectType: {
            description: "The object type of the required skill.",
            type: "string",
            enum: [OccupationEnums.ObjectTypes.Skill],
          },
          relationType: {
            description: "The type of relationship between the occupation and the required skill.",
            type: "string",
            enum: Object.values(OccupationEnums.OccupationToSkillRelationType),
          },
        },
        required: ["id", "UUID", "preferredLabel", "isLocalized", "objectType", "relationType"],
      },
    },
    ..._baseProperties,
    createdAt: { description: "Timestamp of record creation.", type: "string", format: "date-time" },
    updatedAt: { description: "Timestamp of last record modification.", type: "string", format: "date-time" },
  },
  allOf: topLevelOccupationCodeConditions,
  required: [
    "id",
    "UUID",
    "originUUID",
    "UUIDHistory",
    "path",
    "tabiyaPath",
    "code",
    "occupationGroupCode",
    "originUri",
    "preferredLabel",
    "altLabels",
    "definition",
    "description",
    "regulatedProfessionNote",
    "scopeNote",
    "occupationType",
    "modelId",
    "isLocalized",
    "parent",
    "requiresSkills",
    "children",
    "createdAt",
    "updatedAt",
  ],
};
