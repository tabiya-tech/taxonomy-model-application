import { SchemaObject } from "ajv";
import { _baseOccupationGroupChildSchema } from "./schemas.base";
import OccupationGroupEnums from "./enums";
import OccupationGroupConstants from "./constants";
import OccupationGroupRegexes from "./regex";

const SchemaGETResponseChildren: SchemaObject = {
  $id: "/components/schemas/OccupationGroupResponseSchemaGETChildren",
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    properties: {
      ...JSON.parse(JSON.stringify(_baseOccupationGroupChildSchema)),
    },
    allOf: [
      {
        if: { properties: { objectType: { const: OccupationGroupEnums.ObjectTypes.ISCOGroup } } },
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
        if: { properties: { objectType: { const: OccupationGroupEnums.ObjectTypes.LocalGroup } } },
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
        if: { properties: { objectType: { const: OccupationGroupEnums.ObjectTypes.ESCOOccupation } } },
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
        if: { properties: { objectType: { const: OccupationGroupEnums.ObjectTypes.LocalOccupation } } },
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
    required: ["id", "UUID", "code", "preferredLabel", "objectType"],
  },
};

export default SchemaGETResponseChildren;
