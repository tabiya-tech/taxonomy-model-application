import { SchemaObject } from "ajv";
import { _baseProperties } from "./schemas.base";
import OccupationGroupEnums from "./enums";
import OccupationGroupConstants from "./constants";
import OccupationGroupRegexes from "./regex";

const SchemaPOSTRequest: SchemaObject = {
  $id: "/components/schemas/OccupationGroupRequestSchemaPOST",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_baseProperties)), // deep copy the base properties
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
  required: ["preferredLabel", "groupType", "originUri", "UUIDHistory", "code", "description", "altLabels", "modelId"],
};

export default SchemaPOSTRequest;
