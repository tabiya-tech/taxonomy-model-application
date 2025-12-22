import { SchemaObject } from "ajv";
import { _baseChildrenResponseSchema } from "./schemas.base";
import OccupationGroupConstants from "./constants";
import { RegExp_Str_NotEmptyString } from "../../regex";

const SchemaGETChildrenResponse: SchemaObject = {
  $id: "/components/schemas/OccupationGroupChildrenResponseSchemaGET",
  type: "object",
  properties: {
    data: {
      type: "array",
      items: {
        ...JSON.parse(JSON.stringify(_baseChildrenResponseSchema)),
      },
    },
    limit: {
      type: ["integer", "null"],
      minimum: 1,
      maximum: OccupationGroupConstants.MAX_LIMIT,
      default: OccupationGroupConstants.DEFAULT_LIMIT,
      description: "The maximum number of children of occupation groups that could be returned in the response.",
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

export default SchemaGETChildrenResponse;
