import { SchemaObject } from "ajv";
import { _baseProperties } from "../../_shared/schemas.base";
import OccupationEnums from "../../_shared/enums";
import OccupationRegexes from "../../_shared/regex";
import OccupationConstants from "../../_shared/constants";

const SchemaPATCHRequest: SchemaObject = {
  $id: "/components/schemas/OccupationRequestSchemaPATCH",
  type: "object",
  additionalProperties: false,
  properties: {
    ..._baseProperties,
  },
  if: {
    properties: {
      occupationType: { const: OccupationEnums.OccupationType.ESCOOccupation },
    },
  },
  then: {
    properties: {
      code: {
        type: "string",
        maxLength: OccupationConstants.CODE_PATTERN_MAX_LENGTH,
        pattern: OccupationRegexes.Str.ESCO_OCCUPATION_CODE,
      },
      occupationGroupCode: {
        type: "string",
        maxLength: OccupationConstants.CODE_PATTERN_MAX_LENGTH,
        pattern: OccupationRegexes.Str.ISCO_GROUP_CODE,
      },
    },
  },
  else: {
    properties: {
      code: {
        type: "string",
        maxLength: OccupationConstants.CODE_PATTERN_MAX_LENGTH,
        pattern: OccupationRegexes.Str.ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE,
      },
      occupationGroupCode: {
        type: "string",
        maxLength: OccupationConstants.CODE_PATTERN_MAX_LENGTH,
        pattern: OccupationRegexes.Str.LOCAL_GROUP_CODE,
      },
    },
  },
};

export default SchemaPATCHRequest;
