import { RegExp_Str_NotEmptyString, RegExp_Str_UUIDv4, RegExp_Str_ID, RegExp_Str_URI } from "../../../regex";
import OccupationGroupConstants from "./constants";
import OccupationGroupEnums from "./enums";
import OccupationGroupRegexes from "./regex";
import LanguageAPISpecs from "../../../language";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const _baseProperties: any = {
  UUIDHistory: {
    description: "The UUIDs history of the occupation group.",
    type: "array",
    minItems: 0,
    maxItems: OccupationGroupConstants.UUID_HISTORY_MAX_ITEMS,
    uniqueItems: true,
    items: {
      type: "string",
      pattern: RegExp_Str_UUIDv4,
      maxLength: OccupationGroupConstants.MAX_UUID_HISTORY_ITEM_LENGTH,
    },
  },
  originUri: {
    description: "The origin URI of the occupation group.",
    type: "string",
    maxLength: OccupationGroupConstants.ORIGIN_URI_MAX_LENGTH,
    format: "uri",
    pattern: RegExp_Str_NotEmptyString,
  },
  code: {
    description: "The code of the occupation group.",
    type: "string",
    maxLength: OccupationGroupConstants.CODE_MAX_LENGTH,
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
    uniqueItems: true,
    items: {
      type: "string",
      maxLength: OccupationGroupConstants.ALT_LABEL_MAX_LENGTH,
    },
  },
  groupType: {
    description: "The type of the occupation group, e.g., ISCOGroup or LocalGroup.",
    type: "string",
    enum: Object.values(OccupationGroupEnums.ObjectTypes),
  },
  modelId: {
    description: "The identifier of the model for occupation group.",
    type: "string",
    pattern: RegExp_Str_ID,
  },
};

const _translatableStringFields: Record<
  string,
  Omit<LanguageAPISpecs.Types.ITranslatedStringSchemaOptions, "required" | "allowNullToDelete">
> = {
  preferredLabel: {
    description: "The preferred label of the occupation group.",
    maxLength: OccupationGroupConstants.PREFERRED_LABEL_MAX_LENGTH,
    pattern: RegExp_Str_NotEmptyString,
  },
  description: {
    description: "The description of the occupation group.",
    maxLength: OccupationGroupConstants.DESCRIPTION_MAX_LENGTH,
  },
};

function getRequestProperties(
  options: Pick<LanguageAPISpecs.Types.ITranslatedStringSchemaOptions, "required" | "allowNullToDelete">
) {
  return {
    ...JSON.parse(JSON.stringify(_baseProperties)),
    ...Object.fromEntries(
      Object.entries(_translatableStringFields).map(([field, fieldOptions]) => [
        field,
        LanguageAPISpecs.Schemas.getTranslatedString({ ...fieldOptions, ...options }),
      ])
    ),
    altLabels: LanguageAPISpecs.Schemas.getTranslatedStringArray({
      description: "The alternative labels of the occupation group.",
      maxLength: OccupationGroupConstants.ALT_LABEL_MAX_LENGTH,
      maxItems: OccupationGroupConstants.ALT_LABELS_MAX_ITEMS,
    }),
  };
}

// POST and PUT take the full multilingual object; the fallback language is required.
export const _baseRequestProperties = getRequestProperties({ required: true });

// PATCH merges per language: a non-fallback language may be null to delete it.
export const _basePatchRequestProperties = getRequestProperties({ allowNullToDelete: true });

export const _requestExample = {
  originUri: "https://data.europa.eu/esco/isco/C11",
  groupType: OccupationGroupEnums.ObjectTypes.ISCOGroup,
  code: "11",
  preferredLabel: {
    en: "Chief executives, senior officials and legislators",
    fr: "Directeurs généraux et cadres supérieurs",
  },
  altLabels: [{ en: "Senior officials", fr: "Hauts fonctionnaires" }],
  description: {
    en: "Chief executives formulate and review policies.",
    fr: "Les directeurs généraux formulent les politiques.",
  },
  modelId: "6419f91c3b4d8a7b1a2c3d4e",
  UUIDHistory: ["f81d4fae-7dec-11d0-a765-00a0c91e6bf6"],
};

// Sets French, leaves every other language untouched, and deletes the French description.
export const _patchRequestExample = {
  preferredLabel: { fr: "Directeurs généraux" },
  description: { fr: null },
};

export const _baseOccupationGroupURLParameter = {
  modelId: {
    description: "The identifier of the model for occupation group.",
    type: "string",
    pattern: RegExp_Str_ID,
  },
};

export const _detailOccupationGroupURLParameter = {
  ...JSON.parse(JSON.stringify(_baseOccupationGroupURLParameter)),
  id: {
    description: "The id of the occupation group. It can be used to retrieve the occupation group from the server.",
    type: "string",
    pattern: RegExp_Str_ID,
  },
};

export const _baseQueryParameterSchema = {
  limit: {
    description: "The maximum number of items to return.",
    type: "integer",
    minimum: 1,
    maximum: OccupationGroupConstants.MAX_LIMIT,
    default: OccupationGroupConstants.DEFAULT_LIMIT,
  },
  cursor: {
    description: "A base64 string representing the cursor for pagination.",
    type: "string",
    maxLength: OccupationGroupConstants.MAX_CURSOR_LENGTH,
    pattern: RegExp_Str_NotEmptyString,
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
    originUUID: {
      description:
        "The last UUID in the UUIDHistory of occupation group. It can be used to identify the occupation group across systems.",
      type: "string",
      pattern: RegExp_Str_UUIDv4,
    },
    path: {
      description: "The path to the occupation group resource using the resource id",
      type: "string",
      format: "uri",
      pattern: RegExp_Str_URI, // accept only https
      maxLength: OccupationGroupConstants.MAX_PATH_URI_LENGTH,
    },
    tabiyaPath: {
      description: "The path to the occupation group resource using the resource UUID",
      type: "string",
      format: "uri",
      pattern: RegExp_Str_URI,
      maxLength: OccupationGroupConstants.MAX_TABIYA_PATH_LENGTH,
    },
    parent: {
      description: "The parent occupation group of this occupation group.",
      type: ["object", "null"],
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
          enum: Object.values(OccupationGroupEnums.Relations.Parent.ObjectTypes),
        },
      },
      if: {
        properties: {
          objectType: { enum: [OccupationGroupEnums.Relations.Parent.ObjectTypes.ISCOGroup] },
        },
      },
      then: {
        properties: {
          code: {
            type: "string",
            maxLength: OccupationGroupConstants.CODE_MAX_LENGTH,
            pattern: OccupationGroupRegexes.Str.ISCO_GROUP_CODE,
          },
        },
      },
      else: {
        properties: {
          code: {
            type: "string",
            maxLength: OccupationGroupConstants.CODE_MAX_LENGTH,
            pattern: OccupationGroupRegexes.Str.LOCAL_GROUP_CODE,
          },
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
          },
          preferredLabel: {
            description: "The preferred label of the parent occupation group.",
            type: "string",
            maxLength: OccupationGroupConstants.PREFERRED_LABEL_MAX_LENGTH,
            pattern: RegExp_Str_NotEmptyString,
          },
          objectType: {
            description:
              "The type of the occupation group | occupation, e.g., ISCOGroup, LocalGroup, ESCOOccupation, LocalOccupation.",
            type: "string",
            enum: Object.values(OccupationGroupEnums.Relations.Children.ObjectTypes),
          },
        },
        allOf: [
          {
            if: {
              properties: { objectType: { const: OccupationGroupEnums.Relations.Children.ObjectTypes.ISCOGroup } },
            },
            then: {
              properties: {
                code: {
                  type: "string",
                  maxLength: OccupationGroupConstants.CODE_MAX_LENGTH,
                  pattern: OccupationGroupRegexes.Str.ISCO_GROUP_CODE,
                },
              },
            },
          },
          {
            if: {
              properties: { objectType: { const: OccupationGroupEnums.Relations.Children.ObjectTypes.LocalGroup } },
            },
            then: {
              properties: {
                code: {
                  type: "string",
                  maxLength: OccupationGroupConstants.CODE_MAX_LENGTH,
                  pattern: OccupationGroupRegexes.Str.LOCAL_GROUP_CODE,
                },
              },
            },
          },
          {
            if: {
              properties: { objectType: { const: OccupationGroupEnums.Relations.Children.ObjectTypes.ESCOOccupation } },
            },
            then: {
              properties: {
                code: {
                  type: "string",
                  maxLength: OccupationGroupConstants.CODE_MAX_LENGTH,
                  pattern: OccupationGroupRegexes.Str.ESCO_OCCUPATION_CODE,
                },
              },
            },
          },
          {
            if: {
              properties: {
                objectType: { const: OccupationGroupEnums.Relations.Children.ObjectTypes.LocalOccupation },
              },
            },
            then: {
              properties: {
                code: {
                  type: "string",
                  maxLength: OccupationGroupConstants.CODE_MAX_LENGTH,
                  pattern: OccupationGroupRegexes.Str.ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE,
                },
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
  if: {
    properties: {
      groupType: { enum: [OccupationGroupEnums.ObjectTypes.ISCOGroup] },
    },
  },
  then: {
    properties: {
      code: {
        type: "string",
        maxLength: OccupationGroupConstants.CODE_MAX_LENGTH,
        pattern: OccupationGroupRegexes.Str.ISCO_GROUP_CODE,
      },
    },
  },
  else: {
    properties: {
      code: {
        type: "string",
        maxLength: OccupationGroupConstants.CODE_MAX_LENGTH,
        pattern: OccupationGroupRegexes.Str.LOCAL_GROUP_CODE,
      },
    },
  },
  required: [
    "id",
    "UUID",
    "originUUID",
    "path",
    "UUIDHistory",
    "tabiyaPath",
    "originUri",
    "code",
    "description",
    "preferredLabel",
    "parent",
    "children",
    "altLabels",
    "groupType",
    "modelId",
    "createdAt",
    "updatedAt",
  ],
};

export const _baseChildrenResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: {
      description:
        "The id of the child of occupation group. It can be used to retrieve the single child from the server.",
      type: "string",
      pattern: RegExp_Str_ID,
    },
    parentId: {
      description:
        "The id of the parent occupation group. It can be used to retrieve the single parent from the server.",
      type: "string",
      pattern: RegExp_Str_ID,
    },
    UUID: {
      description: "The UUID of the child of occupation group. It can be used to identify the child across systems.",
      type: "string",
      pattern: RegExp_Str_UUIDv4,
    },
    originUUID: {
      description:
        "The last UUID in the UUIDHistory of child of occupation group. It can be used to identify the child across systems.",
      type: "string",
      pattern: RegExp_Str_UUIDv4,
    },
    path: {
      description: "The path to the child of occupation group resource using the resource id",
      type: "string",
      format: "uri",
      pattern: RegExp_Str_URI, // accept only https
      maxLength: OccupationGroupConstants.MAX_PATH_URI_LENGTH,
    },
    tabiyaPath: {
      description: "The path to the child of occupation group resource using the resource UUID",
      type: "string",
      format: "uri",
      pattern: RegExp_Str_URI,
      maxLength: OccupationGroupConstants.MAX_TABIYA_PATH_LENGTH,
    },
    UUIDHistory: {
      description: "The UUIDs history of the child of occupation group.",
      type: "array",
      minItems: 0,
      maxItems: OccupationGroupConstants.UUID_HISTORY_MAX_ITEMS,
      uniqueItems: true,
      items: {
        type: "string",
        pattern: RegExp_Str_UUIDv4,
        maxLength: OccupationGroupConstants.MAX_UUID_HISTORY_ITEM_LENGTH,
      },
    },
    originUri: {
      description: "The origin URI of the child of occupation group.",
      type: "string",
      maxLength: OccupationGroupConstants.ORIGIN_URI_MAX_LENGTH,
      format: "uri",
      pattern: RegExp_Str_NotEmptyString,
    },
    code: {
      description: "The code of the child of occupation group.",
      type: "string",
      maxLength: OccupationGroupConstants.CODE_MAX_LENGTH,
    },
    description: {
      description: "The description of the child of the occupation group.",
      type: "string",
      maxLength: OccupationGroupConstants.DESCRIPTION_MAX_LENGTH,
    },
    preferredLabel: {
      description: "The preferred label of the child of occupation group.",
      type: "string",
      maxLength: OccupationGroupConstants.PREFERRED_LABEL_MAX_LENGTH,
      pattern: RegExp_Str_NotEmptyString,
    },
    altLabels: {
      description: "The alternative labels of the child of the occupation group.",
      type: "array",
      minItems: 0,
      maxItems: OccupationGroupConstants.ALT_LABELS_MAX_ITEMS,
      uniqueItems: true,
      items: {
        type: "string",
        maxLength: OccupationGroupConstants.ALT_LABEL_MAX_LENGTH,
      },
    },
    objectType: {
      description:
        "The type of the child of occupation group, e.g., ISCOGroup, LocalGroup, ESCOOccupation, LocalOccupation.",
      type: "string",
      enum: Object.values(OccupationGroupEnums.Relations.Children.ObjectTypes),
    },
    modelId: {
      description: "The identifier of the model for child of the occupation group.",
      type: "string",
      pattern: RegExp_Str_ID,
    },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
  allOf: [
    {
      if: {
        properties: { objectType: { const: OccupationGroupEnums.Relations.Children.ObjectTypes.ISCOGroup } },
      },
      then: {
        properties: {
          code: {
            type: "string",
            maxLength: OccupationGroupConstants.CODE_MAX_LENGTH,
            pattern: OccupationGroupRegexes.Str.ISCO_GROUP_CODE,
          },
        },
      },
    },
    {
      if: {
        properties: { objectType: { const: OccupationGroupEnums.Relations.Children.ObjectTypes.LocalGroup } },
      },
      then: {
        properties: {
          code: {
            type: "string",
            maxLength: OccupationGroupConstants.CODE_MAX_LENGTH,
            pattern: OccupationGroupRegexes.Str.LOCAL_GROUP_CODE,
          },
        },
      },
    },
    {
      if: {
        properties: { objectType: { const: OccupationGroupEnums.Relations.Children.ObjectTypes.ESCOOccupation } },
      },
      then: {
        properties: {
          code: {
            type: "string",
            maxLength: OccupationGroupConstants.CODE_MAX_LENGTH,
            pattern: OccupationGroupRegexes.Str.ESCO_OCCUPATION_CODE,
          },
        },
      },
    },
    {
      if: {
        properties: {
          objectType: { const: OccupationGroupEnums.Relations.Children.ObjectTypes.LocalOccupation },
        },
      },
      then: {
        properties: {
          code: {
            type: "string",
            maxLength: OccupationGroupConstants.CODE_MAX_LENGTH,
            pattern: OccupationGroupRegexes.Str.ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE,
          },
        },
      },
    },
  ],
  required: [
    "id",
    "parentId",
    "UUID",
    "originUUID",
    "path",
    "tabiyaPath",
    "UUIDHistory",
    "originUri",
    "code",
    "description",
    "preferredLabel",
    "altLabels",
    "objectType",
    "modelId",
    "createdAt",
    "updatedAt",
  ],
};
