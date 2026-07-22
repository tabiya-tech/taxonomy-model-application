import { SchemaObject } from "ajv";
import { _baseQueryParameterSchema } from "../_shared/schemas.base";
import OccupationGroupConstants from "../_shared/constants";
import OccupationGroupEnums from "../_shared/enums";

// The searchable field names, used to validate each entry of the (comma-separated) `searchFields` parameter.
const SEARCHABLE_FIELDS = Object.values(OccupationGroupEnums.SearchableField);

// A comma-separated, non-empty list where every entry is one of the searchable field names,
// e.g. "preferredLabel" or "preferredLabel,description,altLabels".
const SEARCH_FIELDS_PATTERN = `^(${SEARCHABLE_FIELDS.join("|")})(,(${SEARCHABLE_FIELDS.join("|")}))*$`;

const SchemaGETRequestQueryParam: SchemaObject = {
  $id: "/components/schemas/OccupationGroupRequestQueryParamSchemaGET",
  type: "object",
  additionalProperties: false,
  properties: {
    ...JSON.parse(JSON.stringify(_baseQueryParameterSchema)),
    query: {
      description:
        "A free-text value to search the occupation groups by. When set, the endpoint returns the occupation " +
        "groups that match the value on the requested searchFields, ranked by relevance. On released models the " +
        "search uses vector embeddings; on unreleased models it uses a case-insensitive regex.",
      type: "string",
      maxLength: OccupationGroupConstants.SEARCH_VALUE_MAX_LENGTH,
    },
    searchFields: {
      description:
        "A comma-separated list of the occupation group fields to search on (e.g. 'preferredLabel,description'). " +
        "Only meaningful together with 'query'. Defaults to 'preferredLabel' when omitted.",
      type: "string",
      maxLength: OccupationGroupConstants.SEARCH_FIELDS_MAX_LENGTH,
      pattern: SEARCH_FIELDS_PATTERN,
    },
    root: {
      description: "Filter only root occupation groups (occupation groups with no parent).",
      type: "boolean",
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
