import { SchemaObject } from "ajv";
import { _baseResponseSchema } from "./schemas.base";
import OccupationConstants from "./constants";

const SchemaGETResponse: SchemaObject = {
  $id: "/components/schemas/OccupationResponseSchemaGET",
  type: "object",
  additionalProperties: false,
  properties: {
    data: {
      type: "array",
      items: {
        $id: "/components/schemas/OccupationItem",
        ..._baseResponseSchema,
        additionalProperties: false,
      },
      description: "Array of occupation data for the current page",
    },
    limit: {
      type: "integer",
      description: "Number of data returned in this page.",
      minimum: 1,
      maximum: OccupationConstants.MAX_LIMIT,
      default: OccupationConstants.MAX_LIMIT,
    },
    nextCursor: {
      type: ["string", "null"],
      description:
        "Cursor to fetch the next page of results. Opaque token encoding the last item's sort key(s). Returns null if this is the last page.",
      maxLength: OccupationConstants.MAX_CURSOR_LENGTH,
    },
  },
  required: ["data", "limit"],
};

export default SchemaGETResponse;
