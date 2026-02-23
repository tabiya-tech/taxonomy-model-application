import { SchemaObject } from "ajv";
import { _baseResponseSchema as SkillBaseResponseSchema } from "../../schemas.base";
import { _baseResponseSchema as SkillGroupBaseResponseSchema } from "../../../skillGroup/schemas.base";
import SkillConstants from "../../constants";
import { RegExp_Str_NotEmptyString } from "../../../../regex";

const SchemaGETParentResponse: SchemaObject = {
  $id: "/components/schemas/SkillParentResponseSchemaGET",
  type: "object",
  additionalProperties: false,
  properties: {
    data: {
      type: "array",
      items: {
        $id: "/components/schemas/SkillParentItem",
        anyOf: [SkillBaseResponseSchema, SkillGroupBaseResponseSchema],
      },
      description: "Array of skill parents data for the current page",
    },
    limit: {
      type: "integer",
      description: "Number of data returned in this page.",
      minimum: 1,
      maximum: SkillConstants.MAX_LIMIT,
      default: SkillConstants.DEFAULT_LIMIT,
    },
    nextCursor: {
      type: ["string", "null"],
      description:
        "Cursor to fetch the next page of results. Opaque token encoding the last item's sort key(s). Returns null if this is the last page.",
      maxLength: SkillConstants.MAX_CURSOR_LENGTH,
      pattern: RegExp_Str_NotEmptyString,
    },
  },
  required: ["data", "limit"],
};

export default SchemaGETParentResponse;
