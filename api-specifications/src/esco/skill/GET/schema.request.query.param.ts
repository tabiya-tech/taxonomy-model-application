import { SchemaObject } from "ajv";
import { _baseQueryParameterSchema } from "../_shared/schemas.base";
import SkillConstants from "../_shared/constants";
import SkillEnums from "../_shared/enums";

// The searchable field names, used to validate each entry of the (comma-separated) `searchFields` parameter.
const SEARCHABLE_FIELDS = Object.values(SkillEnums.SearchableField);

// A comma-separated, non-empty list where every entry is one of the searchable field names,
// e.g. "preferredLabel" or "preferredLabel, description, altLabels".
const SEARCH_FIELDS_PATTERN = `^(${SEARCHABLE_FIELDS.join("|")})(,(${SEARCHABLE_FIELDS.join("|")}))*$`;

const SchemaGETRequestQueryParam: SchemaObject = {
  $id: "/components/schemas/SkillRequestQueryParamSchemaGET",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_baseQueryParameterSchema)),
    query: {
      description:
        "A free-text value to search the skills by. When set, the endpoint returns the skills that match " +
        "the value on the requested searchFields, ranked by relevance. On released models the search uses " +
        "vector embeddings; on unreleased models it uses a case-insensitive regex.",
      type: "string",
      // An empty value carries no search intent (it would match everything), so require at least one character.
      minLength: 1,
      maxLength: SkillConstants.SEARCH_VALUE_MAX_LENGTH,
    },
    searchFields: {
      description:
        "A comma-separated list of the skill fields to search on (e.g. 'preferredLabel,description'). " +
        "Only meaningful together with 'query'. Defaults to 'preferredLabel' when omitted.",
      type: "string",
      maxLength: SkillConstants.SEARCH_FIELDS_MAX_LENGTH,
      pattern: SEARCH_FIELDS_PATTERN,
    },
  },
  // searchFields on its own (without a query to search) is meaningless, so require a query when searchFields is set.
  // The empty `properties` entries keep AJV strict mode happy (strictRequired requires the referenced
  // property to be defined within the same subschema).
  allOf: [
    {
      if: {
        properties: {
          searchFields: {},
        },
        required: ["searchFields"],
      },
      then: {
        properties: {
          query: {},
        },
        required: ["query"],
      },
    },
  ],
};

export default SchemaGETRequestQueryParam;
