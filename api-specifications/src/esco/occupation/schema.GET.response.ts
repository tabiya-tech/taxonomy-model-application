import { SchemaObject } from "ajv";
import { _baseResponseSchema } from "./schemas.base";
import OccupationConstants from "./constants";
import { RegExp_Str_NotEmptyString } from "../../regex";

const SchemaGETResponse: SchemaObject = {
  $id: "/components/schemas/OccupationResponseSchemaGET",
  type: "object",
  additionalProperties: false,
  properties: {
    items: {
      type: "array",
      items: {
        $id: "/components/schemas/OccupationItem",
        ..._baseResponseSchema,
        additionalProperties: true,
      },
      description: "Array of occupation items for the current page",
    },
    limit: {
      type: "integer",
      description: "Number of items returned in this page.",
      minimum: 1,
      maximum: OccupationConstants.MAX_LIMIT,
      default: OccupationConstants.MAX_CURSOR_LENGTH,
    },
    next_cursor: {
      type: ["string", "null"],
      description:
        "Cursor to fetch the next page of results. Opaque token encoding the last item's sort key(s). Returns null if this is the last page.",
      maxLength: OccupationConstants.MAX_CURSOR_LENGTH,
      pattern: RegExp_Str_NotEmptyString,
    },
  },
  required: ["items", "limit"],
};

export default SchemaGETResponse;
