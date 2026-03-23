import { SchemaObject } from "ajv";
import { _baseResponseSchema } from "../_shared/schemas.base";
import OccupationGroupGETConstants from "./constants";
import { RegExp_Str_NotEmptyString } from "../../../regex";

const SchemaGETResponse: SchemaObject = {
  $id: "/components/schemas/OccupationGroupResponseSchemaGET",
  type: "object",
  properties: {
    data: {
      type: "array",
      items: {
        ...JSON.parse(JSON.stringify(_baseResponseSchema)), // deep copy the base properties
      },
    },
    limit: {
      type: "integer",
      minimum: 1,
      maximum: OccupationGroupGETConstants.MAX_LIMIT,
      default: OccupationGroupGETConstants.DEFAULT_LIMIT,
      description: "The maximum number of occupation groups that could be returned in the response.",
    },
    nextCursor: {
      type: ["string", "null"],
      description:
        "A base64 string representing the cursor for the next page of results. Null if there is no next page.",
      maxLength: OccupationGroupGETConstants.MAX_CURSOR_LENGTH,
      pattern: RegExp_Str_NotEmptyString,
    },
  },
  required: ["data", "limit"],
  additionalProperties: false,
};

export default SchemaGETResponse;
