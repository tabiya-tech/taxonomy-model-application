import ModelInfoConstants from "modelInfo/constants";
import { RegExp_Str_NotEmptyString, RegExp_Str_UUIDv4, RegExp_Str_ID } from "../../regex";
import OccupationGroupConstants from "./constants";
import OccupationGroupEnums from "./enums";
import LocaleConstants from "locale/constants";

/**
 * Common properties for occupation group schemas
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _baseCommonProperties: any = {
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
    pattern: "^https://.*", // accept only https
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
    enum: Object.values(OccupationGroupEnums.ENUMS.GroupType),
  },
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const _baseProperties: any = {
  ...JSON.parse(JSON.stringify(_baseCommonProperties)), // deep copy the common properties of OccupationGroup
  modelId: {
    description: "The identifier of the model for occupation group.",
    type: "string",
    pattern: RegExp_Str_ID,
  },
};

export const _baseResponseBasicSchema = {
  ...JSON.parse(JSON.stringify(_baseCommonProperties)),
  modelId: {
    description: "The model information of the occupation group.",
    type: "object",
    additionalProperties: false,
    properties: {
      id: {
        description: "The id of the model. It can be used to retrieve the model from the server.",
        type: "string",
        pattern: RegExp_Str_ID,
      },
      UUID: {
        description: "The UUID of the model. It can be used to identify the model across systems.",
        type: "string",
        pattern: RegExp_Str_UUIDv4,
      },
      name: {
        description: "The name of the model",
        type: "string",
        pattern: RegExp_Str_NotEmptyString,
        maxLength: ModelInfoConstants.NAME_MAX_LENGTH,
      },
      localeShortCode: {
        description: "The short code of the locale",
        type: "string",
        pattern: RegExp_Str_NotEmptyString,
        maxLength: LocaleConstants.LOCALE_SHORTCODE_MAX_LENGTH,
      },
      version: {
        description: "The version of the model. It should follow the conventions of semantic versioning.",
        type: "string",
        maxLength: ModelInfoConstants.VERSION_MAX_LENGTH,
      },
    },
    required: ["name", "id", "localeShortCode", "version", "UUID"],
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
    ...JSON.parse(JSON.stringify(_baseResponseBasicSchema)), // deep copy the basic response schema of OccupationGroup
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
    "altLabels",
    "groupType",
    "importId",
    "modelId",
    "createdAt",
    "updatedAt",
  ],
};
