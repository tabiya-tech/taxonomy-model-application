import { SchemaObject } from "ajv";
import { _baseResponseSchema } from "./schemas.base";
import SkillConstants from "./constants";
import { RegExp_Str_NotEmptyString } from "../../regex";

const SchemaGETResponse: SchemaObject = {
  $id: "/components/schemas/SkillResponseSchemaGET",
  type: "object",
  additionalProperties: false,
  properties: {
    items: {
      type: "array",
      items: {
        $id: "/components/schemas/SkillItem",
        ..._baseResponseSchema,
        additionalProperties: false,
      },
      description: "Array of skill items for the current page",
    },
    limit: {
      type: "integer",
      description: "Number of items returned in this page.",
      minimum: 1,
      maximum: SkillConstants.MAX_LIMIT,
      default: SkillConstants.MAX_LIMIT,
    },
    next_cursor: {
      type: ["string", "null"],
      description:
        "Cursor to fetch the next page of results. Opaque token encoding the last item's sort key(s). Returns null if this is the last page.",
      maxLength: SkillConstants.MAX_CURSOR_LENGTH,
      pattern: RegExp_Str_NotEmptyString,
    },
  },
  required: ["items", "limit"],
};

export default SchemaGETResponse;
