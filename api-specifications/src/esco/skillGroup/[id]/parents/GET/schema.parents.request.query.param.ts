import { SchemaObject } from "ajv";
import { RegExp_Str_NotEmptyString } from "../../../../../regex";
import SkillGroupConstants from "../../../_shared/constants";

const SchemaGETParentsRequestQuery: SchemaObject = {
  $id: "/components/schemas/SkillGroupParentsRequestQuerySchemaGET",
  type: "object",
  additionalProperties: false,
  properties: {
    limit: {
      description: "Maximum number of items to return",
      type: "integer",
      minimum: 1,
      maximum: SkillGroupConstants.MAX_LIMIT,
      default: SkillGroupConstants.DEFAULT_LIMIT,
    },
    cursor: {
      description: "Pagination cursor for fetching the next page",
      type: "string",
      maxLength: SkillGroupConstants.MAX_CURSOR_LENGTH,
      pattern: RegExp_Str_NotEmptyString,
    },
  },
};

export default SchemaGETParentsRequestQuery;
