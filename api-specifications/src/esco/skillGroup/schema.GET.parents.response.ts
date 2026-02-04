import { SchemaObject } from "ajv";
import { _baseResponseSchema } from "./schemas.base";
import SkillGroupConstants from "./constants";
import { RegExp_Str_NotEmptyString } from "../../regex";

const SchemaGETParentsResponse: SchemaObject = {
  $id: "/components/schemas/SkillGroupParentsResponseSchemaGET",
  type: "object",
  properties: {
    data: {
      type: "array",
      items: {
        ...JSON.parse(JSON.stringify(_baseResponseSchema)),
      },
    },
    limit: {
      type: ["integer", "null"],
      minimum: 1,
      maximum: SkillGroupConstants.MAX_LIMIT,
      default: SkillGroupConstants.DEFAULT_LIMIT,
      description: "The maximum number of parents of skill groups that could be returned in the response.",
    },
    nextCursor: {
      type: ["string", "null"],
      description:
        "A base64 string representing the cursor for the next page of results. Null if there is no next page.",
      maxLength: SkillGroupConstants.MAX_CURSOR_LENGTH,
      pattern: RegExp_Str_NotEmptyString,
    },
  },
  required: ["data", "limit"],
  additionalProperties: false,
};

export default SchemaGETParentsResponse;
