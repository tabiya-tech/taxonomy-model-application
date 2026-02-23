import { SchemaObject } from "ajv";
import SkillConstants from "../../constants";
import { RegExp_Str_NotEmptyString } from "../../../../regex";

const SchemaGETParentsRequestQueryParam: SchemaObject = {
  $id: "/components/schemas/SkillParentsRequestQueryParamSchemaGET",
  type: "object",
  properties: {
    limit: {
      type: "integer",
      description: "The maximum number of parents to return per page.",
      minimum: 1,
      maximum: SkillConstants.MAX_LIMIT,
      default: SkillConstants.DEFAULT_LIMIT,
    },
    cursor: {
      type: "string",
      description: "The cursor for the next page of parents.",
      maxLength: SkillConstants.MAX_CURSOR_LENGTH,
      pattern: RegExp_Str_NotEmptyString,
    },
  },
  required: [],
  additionalProperties: false,
};

export default SchemaGETParentsRequestQueryParam;
