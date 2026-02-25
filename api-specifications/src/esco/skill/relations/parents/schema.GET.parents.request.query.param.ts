import { SchemaObject } from "ajv";
import { RegExp_Str_NotEmptyString } from "../../../../regex";
import SkillConstants from "../../constants";

const SchemaGETParentsRequestQuery: SchemaObject = {
  $id: "/components/schemas/SkillParentsRequestQuerySchemaGET",
  type: "object",
  additionalProperties: false,
  properties: {
    limit: {
      description: "Maximum number of items to return",
      type: "integer",
      minimum: 1,
      maximum: SkillConstants.MAX_LIMIT,
      default: SkillConstants.DEFAULT_LIMIT,
    },
    cursor: {
      description: "Pagination cursor for fetching the next page",
      type: "string",
      maxLength: SkillConstants.MAX_CURSOR_LENGTH,
      pattern: RegExp_Str_NotEmptyString,
    },
  },
};

export default SchemaGETParentsRequestQuery;
