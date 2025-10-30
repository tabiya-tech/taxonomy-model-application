import { RegExp_Str_NotEmptyString, RegExp_Str_UUIDv4, RegExp_Str_ID } from "../../regex";
import SkillGroupConstants from "./constants";
import SkillGroupEnums from "./enums";
import SkillGroupRegexes from "./regex";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const _baseProperties: any = {
  UUIDHistory: {
    description: "The UUIDs history of the skill group.",
    type: "array",
    minItems: 0,
    maxItems: SkillGroupConstants.UUID_HISTORY_MAX_ITEMS,
    uniqueItems: true,
    items: {
      type: "string",
      pattern: RegExp_Str_UUIDv4,
      maxLength: SkillGroupConstants.MAX_UUID_HISTORY_ITEM_LENGTH,
    },
  },
  originUri: {
    description: "The origin URI of the skill group.",
    type: "string",
    maxLength: SkillGroupConstants.ORIGIN_URI_MAX_LENGTH,
    format: "uri",
    pattern: RegExp_Str_NotEmptyString,
  },
  code: {
    description: "The code of the skill group.",
    type: "string",
    maxLength: SkillGroupConstants.CODE_MAX_LENGTH,
    pattern: SkillGroupRegexes.Str.SKILL_GROUP_CODE,
  },
  description: {
    description: "The description of the skill group.",
    type: "string",
    maxLength: SkillGroupConstants.DESCRIPTION_MAX_LENGTH,
  },
  scopeNote: {
    description: "The scope note of the skill group.",
    type: "string",
    maxLength: SkillGroupConstants.MAX_SCOPE_NOTE_LENGTH,
  },
  preferredLabel: {
    description: "The preferred label of the skill group.",
    type: "string",
    maxLength: SkillGroupConstants.PREFERRED_LABEL_MAX_LENGTH,
    pattern: RegExp_Str_NotEmptyString,
  },
  altLabels: {
    description: "The alternative labels of the skill group.",
    type: "array",
    minItems: 0,
    maxItems: SkillGroupConstants.ALT_LABELS_MAX_ITEMS,
    uniqueItems: true,
    items: {
      type: "string",
      maxLength: SkillGroupConstants.ALT_LABEL_MAX_LENGTH,
    },
  },
  modelId: {
    description: "The identifier of the model for skill group.",
    type: "string",
    pattern: RegExp_Str_ID,
  },
};

export const _baseSkillGroupURLParameter = {
  modelId: {
    description: "The identifier of the model for skill group.",
    type: "string",
    pattern: RegExp_Str_ID,
  },
};

export const _detailSkillGroupURLParameter = {
  ...JSON.parse(JSON.stringify(_baseSkillGroupURLParameter)),
  id: {
    description: "The id of the skill group. It can be used to retrieve the skill group from the server.",
    type: "string",
    pattern: RegExp_Str_ID,
  },
};

export const _baseQueryParameterSchema = {
  limit: {
    description: "The maximum number of items to return.",
    type: "integer",
    minimum: 1,
    maximum: SkillGroupConstants.MAX_LIMIT,
    default: SkillGroupConstants.MAX_LIMIT,
  },
  cursor: {
    description: "A base64 string representing the cursor for pagination.",
    type: "string",
    maxLength: SkillGroupConstants.MAX_CURSOR_LENGTH,
    pattern: RegExp_Str_NotEmptyString,
  },
};

export const _baseResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: {
      description: "The id of the skill group. It can be used to retrieve the skill group from the server.",
      type: "string",
      pattern: RegExp_Str_ID,
    },
    UUID: {
      description: "The UUID of the skill group. It can be used to identify the skill group across systems.",
      type: "string",
      pattern: RegExp_Str_UUIDv4,
    },
    originUUID: {
      description:
        "The last UUID in the UUIDHistory of skill group. It can be used to identify the skill group across systems.",
      type: "string",
      pattern: RegExp_Str_UUIDv4,
    },
    path: {
      description: "The path to the skill group resource using the resource id",
      type: "string",
      format: "uri",
      pattern: "^https://.*", // accept only https
      maxLength: SkillGroupConstants.MAX_PATH_URI_LENGTH,
    },
    tabiyaPath: {
      description: "The path to the skill group resource using the resource UUID",
      type: "string",
      format: "uri",
      pattern: "^https://.*", // accept only https
      maxLength: SkillGroupConstants.MAX_TABIYA_PATH_LENGTH,
    },
    parents: {
      description: "The parent skill group of this skill group.",
      type: "array",
      minItems: 0,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: {
            description: "The id of the parent skill group.",
            type: "string",
            pattern: RegExp_Str_ID,
          },
          UUID: {
            description: "The UUID of the parent skill group. It can be used to identify the parent skill group.",
            type: "string",
            pattern: RegExp_Str_UUIDv4,
          },
          code: {
            description: "The code of the parent skill group.",
            type: "string",
            maxLength: SkillGroupConstants.CODE_MAX_LENGTH,
            pattern: SkillGroupRegexes.Str.SKILL_GROUP_CODE,
          },
          preferredLabel: {
            description: "The preferred label of the parent skill group.",
            type: "string",
            maxLength: SkillGroupConstants.PREFERRED_LABEL_MAX_LENGTH,
            pattern: RegExp_Str_NotEmptyString,
          },
          objectType: {
            description: "The type of the skill group, e.g., SkillGroup.",
            type: "string",
            enum: [SkillGroupEnums.ObjectTypes.SkillGroup],
          },
        },
      },
    },
    children: {
      description: "The children of this skill group. which can be either skill groups or skills.",
      type: "array",
      minItems: 0,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: {
            description: "The id of the child skill group or skill.",
            type: "string",
            pattern: RegExp_Str_ID,
          },
          UUID: {
            description:
              "The UUID of the child skill group or skill. It can be used to identify the child skill group or skill.",
            type: "string",
            pattern: RegExp_Str_UUIDv4,
          },
          preferredLabel: {
            description: "The preferred label of the child skill group.",
            type: "string",
            maxLength: SkillGroupConstants.PREFERRED_LABEL_MAX_LENGTH,
            pattern: RegExp_Str_NotEmptyString,
          },
          objectType: {
            description: "The type of the skill group, e.g., SkillGroup, Skill.",
            type: "string",
            enum: Object.values(SkillGroupEnums.ObjectTypes),
          },
          code: {
            description: "Code of the skill group child",
            type: "string",
            maxLength: SkillGroupConstants.CODE_MAX_LENGTH,
            pattern: SkillGroupRegexes.Str.SKILL_GROUP_CODE,
          },
          isLocalized: {
            description: "Indicates if the skill child is localized",
            type: "boolean",
          },
        },
        allOf: [
          {
            if: {
              properties: {
                objectType: {
                  const: SkillGroupEnums.ObjectTypes.SkillGroup,
                },
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
              not: {
                properties: {
                  isLocalized: {},
                },
                required: ["isLocalized"],
              },
            },
          },
          {
            if: {
              properties: {
                objectType: {
                  const: SkillGroupEnums.ObjectTypes.Skill,
                },
              },
            },
            then: {
              properties: {
                isLocalized: {
                  type: "boolean",
                },
              },
              required: ["isLocalized"],
              not: {
                properties: {},
                required: ["code"],
              },
            },
          },
        ],
      },
    },
    ...JSON.parse(JSON.stringify(_baseProperties)),
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
  required: [
    "id",
    "UUID",
    "originUUID",
    "path",
    "tabiyaPath",
    "originUri",
    "code",
    "description",
    "preferredLabel",
    "parents",
    "children",
    "altLabels",
    "modelId",
    "scopeNote",
    "createdAt",
    "updatedAt",
    "UUIDHistory",
  ],
};
