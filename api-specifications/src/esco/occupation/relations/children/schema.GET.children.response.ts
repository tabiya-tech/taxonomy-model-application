import { SchemaObject } from "ajv";
import { _baseResponseSchema } from "../../schemas.base";
import OccupationConstants from "../../constants";
import { RegExp_Str_NotEmptyString } from "../../../../regex";

const SchemaGETChildrenResponse: SchemaObject = {
  $id: "/components/schemas/OccupationResponseSchemaGETChildren",
  type: "object",
  additionalProperties: false,
  properties: {
    data: {
      type: "array",
      items: {
        $id: "/components/schemas/OccupationChildItem",
        ..._baseResponseSchema,
      },
      description: "Array of occupation children data for the current page",
    },
    limit: {
      type: "integer",
      description: "Number of data returned in this page.",
      minimum: 1,
      maximum: OccupationConstants.MAX_LIMIT,
      default: OccupationConstants.DEFAULT_LIMIT,
    },
    nextCursor: {
      type: ["string", "null"],
      description:
        "Cursor to fetch the next page of results. Opaque token encoding the last item's sort key(s). Returns null if this is the last page.",
      maxLength: OccupationConstants.MAX_CURSOR_LENGTH,
      pattern: RegExp_Str_NotEmptyString,
    },
  },
  required: ["data", "limit"],
};

export default SchemaGETChildrenResponse;
