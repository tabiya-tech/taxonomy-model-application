import { SchemaObject } from "ajv";
import { _baseResponseSchema } from "./schemas.base";
import OccupationGroupConstants from "./constants";
import { RegExp_Str_NotEmptyString } from "../../regex";

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
      description: "The maximum number of occupation groups that could be returned in the response.",
      maximum: OccupationGroupConstants.MAX_LIMIT,
      default: OccupationGroupConstants.DEFAULT_LIMIT,
    },
    nextCursor: {
      type: ["string", "null"],
      description:
        "A base64 string representing the cursor for the next page of results. Null if there is no next page.",
      maxLength: OccupationGroupConstants.MAX_CURSOR_LENGTH,
      pattern: RegExp_Str_NotEmptyString,
    },
  },
  required: ["data", "limit"],
  additionalProperties: false,
};

export default SchemaGETResponse;
