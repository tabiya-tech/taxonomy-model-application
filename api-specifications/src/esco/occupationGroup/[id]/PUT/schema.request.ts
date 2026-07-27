import { SchemaObject } from "ajv";
import { _baseProperties } from "../../_shared/schemas.base";
import OccupationGroupEnums from "../../_shared/enums";
import OccupationGroupConstants from "../../_shared/constants";
import OccupationGroupRegexes from "../../_shared/regex";

const SchemaPUTRequest: SchemaObject = {
  $id: "/components/schemas/OccupationGroupRequestSchemaPUT",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_baseProperties)),
  },
  if: {
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
    properties: {
      code: {
        type: "string",
        maxLength: OccupationGroupConstants.CODE_MAX_LENGTH,
        pattern: OccupationGroupRegexes.Str.LOCAL_GROUP_CODE,
      },
    },
  },
  required: ["preferredLabel", "groupType", "originUri", "UUIDHistory", "code", "description", "altLabels", "modelId"],
};

export default SchemaPUTRequest;
