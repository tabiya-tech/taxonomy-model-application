import { SchemaObject } from "ajv";
import { _baseQueryParameterSchema } from "../_shared/schemas.base";
import SkillGroupConstants from "../_shared/constants";
import SkillGroupEnums from "../_shared/enums";
import SkillGroupRegexes from "../_shared/regex";

// The searchable field names, used to validate each entry of the (comma-separated) `searchFields` parameter.
const SEARCHABLE_FIELDS = Object.values(SkillGroupEnums.SearchableField);

// A comma-separated, non-empty list where every entry is one of the searchable field names,
// e.g. "preferredLabel" or "preferredLabel,description,altLabels".
const SEARCH_FIELDS_PATTERN = `^(${SEARCHABLE_FIELDS.join("|")})(,(${SEARCHABLE_FIELDS.join("|")}))*$`;

const SchemaGETRequestQueryParam: SchemaObject = {
  $id: "/components/schemas/SkillGroupRequestQueryParamSchemaGET",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_baseQueryParameterSchema)),
    query: {
      description:
        "A free-text value to search the skill groups by. When set, the endpoint returns the skill groups that " +
        "match the value on the requested searchFields, ranked by relevance. On released models the search uses " +
        "vector embeddings; on unreleased models it uses a case-insensitive regex.",
      type: "string",
      maxLength: SkillGroupConstants.SEARCH_VALUE_MAX_LENGTH,
    },
    searchFields: {
      description:
        "A comma-separated list of the skill group fields to search on (e.g. 'preferredLabel,description'). " +
        "Only meaningful together with 'query'. Defaults to 'preferredLabel' when omitted.",
      type: "string",
      maxLength: SkillGroupConstants.SEARCH_FIELDS_MAX_LENGTH,
      pattern: SEARCH_FIELDS_PATTERN,
    },
    root: {
      description: "Filter only root skill groups (skill groups with no parent).",
      type: "boolean",
    },
    childrenIds: {
      description: "Semicolon-separated IDs of children used to filter parent skill groups.",
      type: "string",
      pattern: SkillGroupRegexes.Str.CHILDREN_IDS,
    },
    childrenType: {
      description: "Type of the children referenced in childrenIds.",
      type: "string",
      enum: Object.values(SkillGroupEnums.Relations.Children.ObjectTypes),
    },
  },
  allOf: [
    // searchFields on its own (without a query to search) is meaningless, so require a query when searchFields is set.
    // The empty `properties` entries keep AJV strict mode happy (strictRequired requires the referenced
    // property to be defined within the same subschema).
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
    {
      if: {
        properties: {
          childrenIds: {},
        },
        required: ["childrenIds"],
      },
      then: {
        properties: {
          childrenType: {},
        },
        required: ["childrenType"],
      },
    },
    {
      if: {
        properties: {
          childrenType: {},
        },
        required: ["childrenType"],
      },
      then: {
        properties: {
          childrenIds: {},
        },
        required: ["childrenIds"],
      },
    },
  ],
};
export default SchemaGETRequestQueryParam;
