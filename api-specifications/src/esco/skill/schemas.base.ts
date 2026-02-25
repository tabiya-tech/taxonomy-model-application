import { RegExp_Str_NotEmptyString, RegExp_Str_UUIDv4, RegExp_Str_ID } from "../../regex";
import SkillConstants from "./constants";
import SkillEnums from "./enums";
import SkillGroupRegexes from "../skillGroup/regex";
import SkillGroupConstants from "../skillGroup/constants";

export const _baseProperties = {
  UUIDHistory: {
    description: "The UUIDs history of the skill.",
    type: "array",
    minItems: 0,
    maxItems: SkillConstants.UUID_HISTORY_MAX_ITEMS,
    uniqueItems: true,
    items: {
      type: "string",
      pattern: RegExp_Str_UUIDv4,
      maxLength: SkillConstants.UUID_HISTORY_MAX_LENGTH,
    },
  },
  originUri: {
    description: "The origin URI of the skill.",
    type: "string",
    format: "uri",
    maxLength: SkillConstants.ORIGIN_URI_MAX_LENGTH,
    pattern: RegExp_Str_NotEmptyString,
  },
  preferredLabel: {
    description: "The preferred label of the skill.",
    type: "string",
    maxLength: SkillConstants.PREFERRED_LABEL_MAX_LENGTH,
    pattern: RegExp_Str_NotEmptyString,
  },
  altLabels: {
    description: "Alternative labels for the skill.",
    type: "array",
    minItems: 0,
    maxItems: SkillConstants.ALT_LABELS_MAX_ITEMS,
    uniqueItems: true,
    items: {
      type: "string",
      maxLength: SkillConstants.ALT_LABEL_MAX_LENGTH,
    },
  },
  definition: {
    description: "The formal definition of the skill.",
    type: "string",
    maxLength: SkillConstants.DEFINITION_MAX_LENGTH,
  },
  description: {
    description: "Additional descriptive information about the skill.",
    type: "string",
    maxLength: SkillConstants.DESCRIPTION_MAX_LENGTH,
  },
  scopeNote: {
    description: "Scope clarification for the skill's application.",
    type: "string",
    maxLength: SkillConstants.SCOPE_NOTE_MAX_LENGTH,
  },
  skillType: {
    description: "The type of the skill (e.g., skill/competence, knowledge, language, attitude).",
    type: "string",
    enum: Object.values(SkillEnums.SkillType).filter((v) => v !== ""),
  },
  reuseLevel: {
    description: "The reuse level of the skill (e.g., sector-specific, transversal).",
    type: "string",
    enum: Object.values(SkillEnums.ReuseLevel).filter((v) => v !== ""),
  },
  isLocalized: {
    description: "Indicates if the skill has localized variants.",
    type: "boolean",
  },
  modelId: {
    description: "The identifier of the model containing this skill.",
    type: "string",
    pattern: RegExp_Str_ID,
  },
};

export const _baseSkillURLParameter = {
  modelId: {
    description: "The identifier of the model for skill.",
    type: "string",
    pattern: RegExp_Str_ID,
  },
};

export const _baseSkillURLParameterWithId = {
  ...JSON.parse(JSON.stringify(_baseSkillURLParameter)),
  id: {
    description: "The id of the skill. It can be used to retrieve the skill from the server.",
    type: "string",
    pattern: RegExp_Str_ID,
  },
};

export const _baseQueryParameterSchema = {
  limit: {
    description: "The maximum number of items to return.",
    type: "integer",
    minimum: 1,
    maximum: SkillConstants.MAX_LIMIT,
    default: SkillConstants.DEFAULT_LIMIT,
  },
  cursor: {
    description: "A base64 string representing the cursor for pagination.",
    type: "string",
    maxLength: SkillConstants.MAX_CURSOR_LENGTH,
    pattern: RegExp_Str_NotEmptyString,
  },
};

// Re-add this as it is used by other schemas like schema.GET.children.response.ts
export const _basePaginationResponseProperties = {
  limit: _baseQueryParameterSchema.limit,
  nextCursor: {
    ..._baseQueryParameterSchema.cursor,
    description:
      "Cursor to fetch the next page of results. Opaque token encoding the last item's sort key(s). Returns null if this is the last page.",
    type: ["string", "null"],
  },
};

export const _baseResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: {
      description: "The unique identifier of the skill.",
      type: "string",
      pattern: RegExp_Str_ID,
    },
    UUID: {
      description: "The UUID of the skill for cross-system identification.",
      type: "string",
      pattern: RegExp_Str_UUIDv4,
    },
    originUUID: {
      description: "The original UUID of the skill, i.e., the first UUID in UUIDHistory",
      type: "string",
      pattern: RegExp_Str_UUIDv4,
      maxLength: SkillConstants.UUID_HISTORY_MAX_LENGTH,
    },
    path: {
      description: "Resource path using the skill's ID.",
      type: "string",
      format: "uri",
      pattern: "^https://.*",
      maxLength: SkillConstants.PATH_URI_MAX_LENGTH,
    },
    tabiyaPath: {
      description: "Resource path using the skill's UUID.",
      type: "string",
      format: "uri",
      pattern: "^https://.*",
      maxLength: SkillConstants.TABIYA_PATH_URI_MAX_LENGTH,
    },
    parents: {
      description: "The parent skills or skill groups of this skill.",
      type: "array",
      minItems: 0,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: {
            description: "The id of the parent skill or skill group.",
            type: "string",
            pattern: RegExp_Str_ID,
          },
          UUID: {
            description: "The UUID of the parent skill or skill group.",
            type: "string",
            pattern: RegExp_Str_UUIDv4,
          },
          preferredLabel: {
            description: "The preferred label of the parent skill or skill group.",
            type: "string",
            maxLength: SkillConstants.PREFERRED_LABEL_MAX_LENGTH,
            pattern: RegExp_Str_NotEmptyString,
          },
          objectType: {
            description: "The type of the parent, e.g., Skill or SkillGroup.",
            type: "string",
            enum: Object.values(SkillEnums.Relations.Parents.ObjectTypes),
          },
          code: {
            description: "The code of the parent skill group.",
            type: "string",
            maxLength: SkillGroupConstants.CODE_MAX_LENGTH,
          },
        },
        if: {
          properties: {
            objectType: { enum: [SkillEnums.ObjectTypes.SkillGroup] },
          },
        },
        then: {
          properties: {
            code: {
              type: "string",
              maxLength: SkillGroupConstants.CODE_MAX_LENGTH,
              pattern: SkillGroupRegexes.Str.SKILL_GROUP_CODE,
            },
          },
          required: ["code"],
        },
        required: ["id", "UUID", "preferredLabel", "objectType"],
      },
    },
    children: {
      description: "The children of this skill.",
      type: "array",
      minItems: 0,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { description: "The id of the child skill.", type: "string", pattern: RegExp_Str_ID },
          UUID: { description: "The UUID of the child skill.", type: "string", pattern: RegExp_Str_UUIDv4 },
          preferredLabel: {
            description: "The preferred label of the child skill.",
            type: "string",
            maxLength: SkillConstants.PREFERRED_LABEL_MAX_LENGTH,
            pattern: RegExp_Str_NotEmptyString,
          },
          objectType: {
            description: "The type of the child, e.g., Skill.",
            type: "string",
            enum: Object.values(SkillEnums.Relations.Children.ObjectTypes),
          },
          isLocalized: {
            description: "Indicates if the child skill is localized.",
            type: "boolean",
          },
        },
        allOf: [
          {
            if: {
              properties: { objectType: { const: SkillEnums.ObjectTypes.Skill } },
            },
            then: {
              properties: {
                isLocalized: { type: "boolean" },
              },
              required: ["isLocalized"],
            },
          },
        ],
        required: ["id", "UUID", "preferredLabel", "objectType"],
      },
    },
    requiresSkills: {
      description: "Skills required by this skill with relationship metadata.",
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
            maxLength: SkillConstants.PREFERRED_LABEL_MAX_LENGTH,
            pattern: RegExp_Str_NotEmptyString,
          },
          isLocalized: { description: "Indicates if the required skill is localized.", type: "boolean" },
          objectType: {
            description: "The object type of the required skill.",
            type: "string",
            enum: [SkillEnums.ObjectTypes.Skill],
          },
          relationType: {
            description: "The type of relationship between skills.",
            type: "string",
            enum: Object.values(SkillEnums.SkillToSkillRelationType),
          },
        },
        required: ["id", "UUID", "preferredLabel", "isLocalized", "objectType", "relationType"],
      },
    },
    requiredBySkills: {
      description: "Skills that require this skill with relationship metadata.",
      type: "array",
      minItems: 0,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { description: "The ID of the requiring skill.", type: "string", pattern: RegExp_Str_ID },
          UUID: { description: "The UUID of the requiring skill.", type: "string", pattern: RegExp_Str_UUIDv4 },
          preferredLabel: {
            description: "The preferred label of the requiring skill.",
            type: "string",
            maxLength: SkillConstants.PREFERRED_LABEL_MAX_LENGTH,
            pattern: RegExp_Str_NotEmptyString,
          },
          isLocalized: { description: "Indicates if the requiring skill is localized.", type: "boolean" },
          objectType: {
            description: "The object type of the requiring skill.",
            type: "string",
            enum: [SkillEnums.ObjectTypes.Skill],
          },
          relationType: {
            description: "The type of relationship between skills.",
            type: "string",
            enum: Object.values(SkillEnums.SkillToSkillRelationType),
          },
        },
        required: ["id", "UUID", "preferredLabel", "isLocalized", "objectType", "relationType"],
      },
    },
    requiredByOccupations: {
      description: "Occupations that require this skill with relationship metadata.",
      type: "array",
      minItems: 0,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { description: "The ID of the requiring occupation.", type: "string", pattern: RegExp_Str_ID },
          UUID: { description: "The UUID of the requiring occupation.", type: "string", pattern: RegExp_Str_UUIDv4 },
          preferredLabel: {
            description: "The preferred label of the requiring occupation.",
            type: "string",
            maxLength: SkillConstants.PREFERRED_LABEL_MAX_LENGTH,
            pattern: RegExp_Str_NotEmptyString,
          },
          isLocalized: { description: "Indicates if the requiring occupation is localized.", type: "boolean" },
          objectType: {
            description: "The object type of the requiring occupation.",
            type: "string",
            enum: Object.values(SkillEnums.OccupationObjectTypes),
          },
          relationType: {
            description: "Used for ESCOOccupations only.",
            type: ["string", "null"],
            enum: [...Object.values(SkillEnums.OccupationToSkillRelationType), null],
          },
          signallingValue: {
            description: "Used for LocalOccupations only.",
            type: ["number", "null"],
            minimum: SkillConstants.SIGNALLING_VALUE_MIN,
            maximum: SkillConstants.SIGNALLING_VALUE_MAX,
          },
          signallingValueLabel: {
            description: "Used for LocalOccupations only.",
            type: ["string", "null"],
            maxLength: SkillConstants.SIGNALLING_VALUE_LABEL_MAX_LENGTH,
            enum: [...Object.values(SkillEnums.SignallingValueLabel), null],
          },
        },
        required: ["id", "UUID", "preferredLabel", "isLocalized", "objectType"],
        allOf: [
          {
            if: {
              properties: { objectType: { const: SkillEnums.OccupationObjectTypes.ESCOOccupation } },
            },
            then: {
              properties: {
                relationType: { type: "string" },
              },
              required: ["relationType"],
            },
          },
          {
            if: {
              properties: { objectType: { const: SkillEnums.OccupationObjectTypes.LocalOccupation } },
            },
            then: {
              properties: {
                signallingValue: { type: "number" },
                signallingValueLabel: { type: "string" },
              },
              required: ["signallingValue", "signallingValueLabel"],
            },
          },
        ],
      },
    },
    ..._baseProperties,
    createdAt: { description: "Timestamp of record creation.", type: "string", format: "date-time" },
    updatedAt: { description: "Timestamp of last record modification.", type: "string", format: "date-time" },
  },
  required: [
    "id",
    "UUID",
    "originUUID",
    "UUIDHistory",
    "path",
    "tabiyaPath",
    "preferredLabel",
    "originUri",
    "altLabels",
    "definition",
    "description",
    "scopeNote",
    "skillType",
    "reuseLevel",
    "isLocalized",
    "modelId",
    "parents",
    "children",
    "requiresSkills",
    "requiredBySkills",
    "requiredByOccupations",
    "createdAt",
    "updatedAt",
  ],
};
