import { SchemaObject } from "ajv";
import { _baseOccupationGroupParentSchema } from "./schemas.base";
import OccupationGroupEnums from "./enums";
import OccupationGroupConstants from "./constants";
import OccupationGroupRegexes from "./regex";

const SchemaGETResponseParent: SchemaObject = {
  $id: "/components/schemas/OccupationGroupResponseSchemaGETParent",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_baseOccupationGroupParentSchema)),
  },
  if: {
    properties: {
      objectType: { enum: [OccupationGroupEnums.ObjectTypes.ISCOGroup] },
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
  required: ["id", "UUID", "code", "preferredLabel", "objectType"],
};

export default SchemaGETResponseParent;
