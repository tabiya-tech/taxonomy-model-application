import { SchemaObject } from "ajv";
import { _baseProperties } from "../../_shared/schemas.base";
import OccupationGroupEnums from "../../_shared/enums";
import OccupationGroupConstants from "../../_shared/constants";
import OccupationGroupRegexes from "../../_shared/regex";

const SchemaPATCHRequest: SchemaObject = {
  $id: "/components/schemas/OccupationGroupRequestSchemaPATCH",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_baseProperties)),
  },
  if: {
    required: ["groupType"],
    properties: {
      groupType: { const: OccupationGroupEnums.ObjectTypes.ISCOGroup },
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
    if: {
      required: ["groupType"],
      properties: {
        groupType: { const: OccupationGroupEnums.ObjectTypes.LocalGroup },
      },
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
};

export default SchemaPATCHRequest;
