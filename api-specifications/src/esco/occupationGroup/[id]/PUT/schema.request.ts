import { SchemaObject } from "ajv";
import { _baseRequestProperties, _requestExample } from "../../_shared/schemas.base";
import OccupationGroupEnums from "../../_shared/enums";
import OccupationGroupConstants from "../../_shared/constants";
import OccupationGroupRegexes from "../../_shared/regex";

const SchemaPUTRequest: SchemaObject = {
  $id: "/components/schemas/OccupationGroupRequestSchemaPUT",
  type: "object",
  additionalProperties: false,
  examples: [_requestExample],
  properties: {
    ..._baseRequestProperties,
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
