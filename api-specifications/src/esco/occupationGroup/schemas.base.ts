import { RegExp_Str_NotEmptyString, RegExp_Str_UUIDv4, RegExp_Str_ID } from "../../regex";
import OccupationGroupConstants from "./constants";
import OccupationGroupEnums from "./enums";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const _baseProperties: any = {
  UUIDHistory: {
    description: "The UUiDs history of the occupation group.",
    type: "array",
    minItems: 0,
    items: {
      type: "string",
      pattern: RegExp_Str_UUIDv4,
    },
  },
  originUri: {
    description: "The origin URI of the occupation group.",
    type: "string",
    format: "uri",
    pattern: "^https://.*",
    maxLength: OccupationGroupConstants.MAX_URI_LENGTH,
  },
  code: {
    description: "The code of the occupation group.",
    type: "string",
    maxLength: OccupationGroupConstants.CODE_MAX_LENGTH,
    pattern: RegExp_Str_NotEmptyString,
  },
  description: {
    description: "The description of the occupation group.",
    type: "string",
    maxLength: OccupationGroupConstants.DESCRIPTION_MAX_LENGTH,
  },
  preferredLabel: {
    description: "The preferred label of the occupation group.",
    type: "string",
    maxLength: OccupationGroupConstants.PREFERRED_LABEL_MAX_LENGTH,
    pattern: RegExp_Str_NotEmptyString,
  },
  altLabels: {
    description: "The alternative labels of the occupation group.",
    type: "array",
    minItems: 0,
    maxItems: OccupationGroupConstants.ALT_LABELS_MAX_ITEMS,
    items: {
      type: "string",
      maxLength: OccupationGroupConstants.ALT_LABEL_MAX_LENGTH,
    },
  },
  importId: {
    description: "The import ID of the occupation group.",
    type: "string",
    maxLength: OccupationGroupConstants.IMPORT_ID_MAX_LENGTH,
  },
  groupType: {
    description: "The type of the occupation group, e.g., ISCOGroup or LocalGroup.",
    type: "string",
    enum: Object.values(OccupationGroupEnums.ENUMS.ObjectTypes),
  },
  modelId: {
    description: "The identifier of the model for occupation group.",
    type: "string",
    pattern: RegExp_Str_ID,
  },
};

export const _baseResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: {
      description: "The id of the occupation group. It can be used to retrieve the occupation group from the server.",
      type: "string",
      pattern: RegExp_Str_ID,
    },
    UUID: {
      description: "The UUID of the occupation group. It can be used to identify the occupation group across systems.",
      type: "string",
      pattern: RegExp_Str_UUIDv4,
    },
    path: {
      description: "The path to the occupation group resource using the resource id",
      type: "string",
      format: "uri",
      pattern: "^https://.*", // accept only https
      maxLength: OccupationGroupConstants.MAX_URI_LENGTH,
    },
    tabiyaPath: {
      description: "The path to the occupation group resource using the resource UUID",
      type: "string",
      format: "uri",
      pattern: "^https://.*", // accept only https
      maxLength: OccupationGroupConstants.MAX_URI_LENGTH,
    },
    parent: {
      description: "The parent occupation group of this occupation group.",
      type: "object",
      additionalProperties: false,
      properties: {
        id: {
          description: "The id of the parent occupation group.",
          type: "string",
          pattern: RegExp_Str_ID,
        },
        UUID: {
          description: "The UUID of the occupation group. It can be used to identify the parent occupation group.",
          type: "string",
          pattern: RegExp_Str_UUIDv4,
        },
        code: {
          description: "The code of the parent occupation group.",
          type: "string",
          maxLength: OccupationGroupConstants.CODE_MAX_LENGTH,
          pattern: RegExp_Str_NotEmptyString,
        },
        preferredLabel: {
          description: "The preferred label of the parent occupation group.",
          type: "string",
          maxLength: OccupationGroupConstants.PREFERRED_LABEL_MAX_LENGTH,
          pattern: RegExp_Str_NotEmptyString,
        },
        objectType: {
          description: "The type of the occupation group, e.g., ISCOGroup or LocalGroup.",
          type: "string",
          enum: Object.values(OccupationGroupEnums.ENUMS.ObjectTypes),
        },
      },
    },
    children: {
      description: "The children of this occupation group, which can be either occupation groups or occupations.",
      type: "array",
      minItems: 0,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: {
            description: "The id of the parent occupation group.",
            type: "string",
            pattern: RegExp_Str_ID,
          },
          UUID: {
            description: "The UUID of the occupation group. It can be used to identify the parent occupation group.",
            type: "string",
            pattern: RegExp_Str_UUIDv4,
          },
          code: {
            description: "The code of the parent occupation group.",
            type: "string",
            maxLength: OccupationGroupConstants.CODE_MAX_LENGTH,
            pattern: RegExp_Str_NotEmptyString,
          },
          preferredLabel: {
            description: "The preferred label of the parent occupation group.",
            type: "string",
            maxLength: OccupationGroupConstants.PREFERRED_LABEL_MAX_LENGTH,
            pattern: RegExp_Str_NotEmptyString,
          },
          objectType: {
            description: "The type of the occupation group, e.g., ISCOGroup or LocalGroup.",
            type: "string",
            enum: Object.values(OccupationGroupEnums.ENUMS.ObjectTypes),
          },
        },
      },
    },
    ...JSON.parse(JSON.stringify(_baseProperties)),
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
  required: [
    "id",
    "UUID",
    "path",
    "tabiyaPath",
    "originUri",
    "code",
    "description",
    "preferredLabel",
    "parent",
    "children",
    "altLabels",
    "groupType",
    "importId",
    "modelId",
    "createdAt",
    "updatedAt",
  ],
};
